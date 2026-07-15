import { builder } from "../builder";
import { requireUser, notFound, badRequest } from "../errors";
import { AccountRef } from "../types/views";
import { MutationResultRef } from "../types/results";
import { getAccounts } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { okString, okMoney, okColor, LIMITS } from "@/lib/validate";
import { resolveMerchant } from "@/lib/merchant/resolve";

builder.queryField("accounts", (t) =>
  t.field({
    type: [AccountRef],
    resolve: (_root, _args, ctx) => getAccounts(requireUser(ctx)),
  }),
);

const AccountCreateInput = builder.inputType("AccountCreateInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    type: t.string(),
    balance: t.float({ required: true }),
    number: t.string(),
    gradient: t.string(),
    institution: t.string(),
  }),
});

const AccountUpdateInput = builder.inputType("AccountUpdateInput", {
  fields: (t) => ({
    name: t.string(),
    type: t.string(),
    balance: t.float(),
    number: t.string(),
    gradient: t.string(),
    institution: t.string(),
  }),
});

builder.mutationField("createAccount", (t) =>
  t.field({
    type: MutationResultRef,
    args: { input: t.arg({ type: AccountCreateInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireUser(ctx);
      if (!okString(input.name, LIMITS.NAME)) badRequest("Name is too long.");
      if (!okString(input.number, LIMITS.ACCOUNT_NUMBER)) badRequest("Account number is too long.");
      if (!okString(input.institution, LIMITS.NAME)) badRequest("Bank name is too long.");
      if (!okMoney(input.balance)) badRequest("Balance is out of range.");
      if (!okColor(input.gradient)) badRequest("Invalid color.");
      if ((await prisma.account.count({ where: { userId } })) >= 100) {
        badRequest("Account limit reached.");
      }
      // Resolve the bank logo the SAME way subscriptions/investments do — a single
      // interactive create, so a brief wait on an unknown institution is fine
      // (known banks are a dictionary hit). Failures degrade to no logo.
      const institution = input.institution?.trim() || undefined;
      const domain = institution ? (await resolveMerchant(institution)).domain : null;
      const account = await prisma.account.create({
        data: {
          userId,
          name: input.name,
          type: input.type || "other",
          balance: input.balance,
          number: input.number || undefined,
          gradient: input.gradient || undefined,
          institution,
          domain: domain ?? undefined,
        },
      });
      return { ok: true, id: account.id };
    },
  }),
);

builder.mutationField("updateAccount", (t) =>
  t.field({
    type: MutationResultRef,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: AccountUpdateInput, required: true }),
    },
    resolve: async (_root, { id, input }, ctx) => {
      const userId = requireUser(ctx);
      if (!okString(input.name, LIMITS.NAME)) badRequest("Name is too long.");
      if (!okString(input.number, LIMITS.ACCOUNT_NUMBER)) badRequest("Account number is too long.");
      if (!okString(input.institution, LIMITS.NAME)) badRequest("Bank name is too long.");
      if (!okMoney(input.balance)) badRequest("Balance is out of range.");
      if (!okColor(input.gradient)) badRequest("Invalid color.");
      const existing = await prisma.account.findFirst({ where: { id, userId } });
      if (!existing) notFound();
      // A Plaid-synced account's balance is an anchor reconciled from the bank;
      // let the user rename/recolor it but never hand-edit its balance.
      if (input.balance != null && existing.plaidItemId != null) {
        badRequest("A connected account's balance is managed by your bank.");
      }

      const data: {
        name?: string;
        type?: string;
        balance?: number;
        number?: string | null;
        gradient?: string | null;
        institution?: string | null;
        domain?: string | null;
      } = {};
      if (input.name != null) data.name = input.name;
      if (input.type != null) data.type = input.type;
      if (input.balance != null) data.balance = input.balance;
      if (input.number !== undefined) data.number = input.number || null;
      if (input.gradient !== undefined) data.gradient = input.gradient || null;
      // Re-resolve the logo only when the institution changed. Clearing it wipes
      // the logo; setting a new one resolves via the same path as subscriptions
      // (dictionary → Merchant cache → Claude). A failed resolve keeps no logo.
      if (input.institution !== undefined) {
        const trimmed = (input.institution || "").trim();
        if (trimmed !== (existing.institution ?? "")) {
          data.institution = trimmed || null;
          data.domain = trimmed ? ((await resolveMerchant(trimmed)).domain ?? null) : null;
        }
      }

      await prisma.account.update({ where: { id }, data });
      return { ok: true, id };
    },
  }),
);

builder.mutationField("deleteAccount", (t) =>
  t.field({
    type: MutationResultRef,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      const userId = requireUser(ctx);
      const existing = await prisma.account.findFirst({ where: { id, userId } });
      if (!existing) notFound();
      await prisma.account.delete({ where: { id } });
      return { ok: true, id };
    },
  }),
);

// Hide/show a single account locally without unlinking its bank. Excluded
// accounts stay synced but drop out of net worth + totals.
builder.mutationField("setAccountExcluded", (t) =>
  t.field({
    type: MutationResultRef,
    args: {
      id: t.arg.id({ required: true }),
      excluded: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, { id, excluded }, ctx) => {
      const userId = requireUser(ctx);
      // deleteMany-scoped update so one user can't toggle another's account.
      const { count } = await prisma.account.updateMany({
        where: { id, userId },
        data: { excluded },
      });
      if (count === 0) notFound();
      return { ok: true, id };
    },
  }),
);
