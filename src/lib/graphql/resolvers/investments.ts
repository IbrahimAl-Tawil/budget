import { builder } from "../builder";
import { requireUser, notFound, badRequest } from "../errors";
import { InvestmentRef } from "../types/views";
import { MutationResultRef } from "../types/results";
import { getInvestments } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { okMoney, okString, okEnum, LIMITS } from "@/lib/validate";
import { ASSET_CLASSES } from "@/lib/constants";
import { resolveMerchant, dictionaryDomain } from "@/lib/merchant/resolve";
import { lookupSymbol, searchSymbols } from "@/lib/market/prices";
import { getUserRow } from "@/lib/db/user";

builder.queryField("investments", (t) =>
  t.field({
    type: [InvestmentRef],
    resolve: (_root, _args, ctx) => getInvestments(requireUser(ctx)),
  }),
);

// ── Ticker autofill ─────────────────────────────────────────────────────────
// Resolve a raw ticker → { name, asset class, live price, logo domain } so the
// Add-investment form imports everything and the user only enters shares.
// Returns null when the symbol can't be identified (the form falls back to
// manual entry). Auth-gated; the symbol is charset/length-guarded before it
// reaches any outbound URL.
const TickerQuoteRef = builder
  .objectRef<{
    symbol: string;
    name: string;
    assetClass: string;
    price: number | null;
    changePct: number | null;
    currency: string;
    domain: string | null;
  }>("TickerQuote")
  .implement({
    fields: (t) => ({
      symbol: t.exposeString("symbol"),
      name: t.exposeString("name"),
      assetClass: t.exposeString("assetClass"),
      price: t.exposeFloat("price", { nullable: true }),
      changePct: t.exposeFloat("changePct", { nullable: true }),
      currency: t.exposeString("currency"),
      domain: t.exposeString("domain", { nullable: true }),
    }),
  });

// Name/ticker search → a list of candidates for the Add-investment picker. No
// price per row (that would be N quote calls per keystroke); the price is
// fetched once, on selection, via resolveTicker. Logos come from the free
// dictionary tier only, so the typeahead never triggers a Claude call.
const SecurityMatchRef = builder
  .objectRef<{
    symbol: string;
    name: string;
    assetClass: string;
    exchange: string;
    domain: string | null;
  }>("SecurityMatch")
  .implement({
    fields: (t) => ({
      symbol: t.exposeString("symbol"),
      name: t.exposeString("name"),
      assetClass: t.exposeString("assetClass"),
      exchange: t.exposeString("exchange"),
      domain: t.exposeString("domain", { nullable: true }),
    }),
  });

builder.queryField("searchSecurities", (t) =>
  t.field({
    type: [SecurityMatchRef],
    args: { query: t.arg.string({ required: true }) },
    resolve: async (_root, { query }, ctx) => {
      requireUser(ctx);
      const q = query.trim();
      if (q.length < 1 || q.length > 40) return [];
      const matches = await searchSymbols(q);
      return matches.map((m) => ({ ...m, domain: dictionaryDomain(m.name) }));
    },
  }),
);

const TICKER_RE = /^[A-Za-z0-9.^=-]{1,20}$/;

builder.queryField("resolveTicker", (t) =>
  t.field({
    type: TickerQuoteRef,
    nullable: true,
    args: { symbol: t.arg.string({ required: true }) },
    resolve: async (_root, { symbol }, ctx) => {
      const userId = requireUser(ctx);
      const sym = symbol.trim();
      if (!TICKER_RE.test(sym)) return null;

      const user = await getUserRow(userId);
      const lookup = await lookupSymbol(sym, user?.currency ?? "CAD");
      if (!lookup) return null;

      // Same logo path holdings use; this warms the cache the create mutation
      // reads, so saving won't trigger a second (Claude) resolution.
      const domain = (await resolveMerchant(lookup.name)).domain;
      return { ...lookup, domain };
    },
  }),
);

const InvestmentCreateInput = builder.inputType("InvestmentCreateInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    symbol: t.string(),
    assetClass: t.string({ required: true }),
    accountId: t.id(),
    value: t.float({ required: true }),
    costBasis: t.float(),
    quantity: t.float(),
  }),
});

const InvestmentUpdateInput = builder.inputType("InvestmentUpdateInput", {
  fields: (t) => ({
    name: t.string(),
    symbol: t.string(),
    assetClass: t.string(),
    accountId: t.id(),
    value: t.float(),
    costBasis: t.float(),
    quantity: t.float(),
  }),
});

/** Shared numeric guards. Quantity is a unit count (not money) but shares the
    same magnitude ceiling so a garbage value can't reach Postgres. */
function badQuantity(q: number | null | undefined): boolean {
  return q != null && (!Number.isFinite(q) || q < 0 || q > LIMITS.MONEY_MAX);
}

builder.mutationField("createInvestment", (t) =>
  t.field({
    type: MutationResultRef,
    args: { input: t.arg({ type: InvestmentCreateInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireUser(ctx);
      if (!okString(input.name, LIMITS.NAME) || !input.name.trim()) {
        badRequest("Give the investment a name.");
      }
      if (!okString(input.symbol, LIMITS.NAME)) badRequest("Symbol is too long.");
      // okEnum accepts "" for optional args; asset class is required, so reject empty.
      if (!input.assetClass || !okEnum(input.assetClass, ASSET_CLASSES)) {
        badRequest("Pick an asset class.");
      }
      if (!okMoney(input.value) || input.value <= 0) {
        badRequest("Enter a value greater than zero.");
      }
      if (input.costBasis != null && (!okMoney(input.costBasis) || input.costBasis < 0)) {
        badRequest("Cost basis is out of range.");
      }
      if (badQuantity(input.quantity)) badRequest("Quantity is out of range.");
      // A client-supplied accountId must belong to the caller (BOLA guard) —
      // otherwise the joined accountName would leak another user's account.
      if (input.accountId) {
        const acct = await prisma.account.findFirst({ where: { id: input.accountId, userId } });
        if (!acct) notFound("Account not found.");
      }
      if ((await prisma.investment.count({ where: { userId } })) >= 500) {
        badRequest("Investment limit reached.");
      }

      const name = input.name.trim();
      // Resolve a logo domain the same way subscriptions do (dictionary/cache →
      // Claude on a miss). Brand-y holding names ("Apple", "Vanguard", "Bitcoin")
      // resolve to a favicon; unknowns degrade to a letter tile. Never throws.
      const merchant = await resolveMerchant(name);

      const inv = await prisma.investment.create({
        data: {
          userId,
          name,
          symbol: input.symbol?.trim() || undefined,
          assetClass: input.assetClass,
          accountId: input.accountId || undefined,
          value: Math.abs(input.value),
          costBasis: input.costBasis != null ? Math.abs(input.costBasis) : undefined,
          quantity: input.quantity ?? undefined,
          domain: merchant.domain,
        },
      });
      return { ok: true, id: inv.id };
    },
  }),
);

builder.mutationField("updateInvestment", (t) =>
  t.field({
    type: MutationResultRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: InvestmentUpdateInput, required: true }),
    },
    resolve: async (_root, { id, input }, ctx) => {
      const userId = requireUser(ctx);
      if (input.name != null && (!okString(input.name, LIMITS.NAME) || !input.name.trim())) {
        badRequest("Give the investment a name.");
      }
      if (!okString(input.symbol, LIMITS.NAME)) badRequest("Symbol is too long.");
      if (input.assetClass != null && (!input.assetClass || !okEnum(input.assetClass, ASSET_CLASSES))) {
        badRequest("Pick an asset class.");
      }
      if (input.value != null && (!okMoney(input.value) || input.value <= 0)) {
        badRequest("Enter a value greater than zero.");
      }
      if (input.costBasis != null && (!okMoney(input.costBasis) || input.costBasis < 0)) {
        badRequest("Cost basis is out of range.");
      }
      if (badQuantity(input.quantity)) badRequest("Quantity is out of range.");

      const existing = await prisma.investment.findFirst({ where: { id, userId } });
      if (!existing) notFound();

      if (input.accountId) {
        const acct = await prisma.account.findFirst({ where: { id: input.accountId, userId } });
        if (!acct) notFound("Account not found.");
      }

      const data: {
        name?: string;
        symbol?: string | null;
        assetClass?: string;
        accountId?: string | null;
        value?: number;
        costBasis?: number | null;
        quantity?: number | null;
        domain?: string | null;
      } = {};

      if (input.name != null) {
        const trimmed = input.name.trim();
        data.name = trimmed;
        // Re-resolve the logo only when the name changed, and only overwrite the
        // stored domain when we got a real one back — a failed re-resolve keeps
        // the existing logo rather than wiping it.
        if (trimmed !== existing.name) {
          const resolved = (await resolveMerchant(trimmed)).domain;
          if (resolved) data.domain = resolved;
        }
      }
      if (input.symbol !== undefined) data.symbol = input.symbol?.trim() || null;
      if (input.assetClass != null) data.assetClass = input.assetClass;
      if (input.accountId !== undefined) data.accountId = input.accountId || null;
      if (input.value != null) data.value = Math.abs(input.value);
      if (input.costBasis !== undefined) {
        data.costBasis = input.costBasis == null ? null : Math.abs(input.costBasis);
      }
      if (input.quantity !== undefined) data.quantity = input.quantity ?? null;

      if (Object.keys(data).length > 0) {
        await prisma.investment.update({ where: { id }, data });
      }
      return { ok: true, id };
    },
  }),
);

builder.mutationField("deleteInvestment", (t) =>
  t.field({
    type: MutationResultRef,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      const userId = requireUser(ctx);
      // Scope the delete to the caller so it can't remove another user's row.
      const { count } = await prisma.investment.deleteMany({ where: { id, userId } });
      if (count === 0) notFound();
      return { ok: true, id };
    },
  }),
);
