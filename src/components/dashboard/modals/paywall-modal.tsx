"use client";

// otterfund — paywall modal. Shown when a user tries to use a feature their
// plan doesn't include (bank sync, insights, advisor, investments). On-brand:
// otter mark + Wordmark, Newsreader price, one accent from the active theme,
// pill CTAs, subtle accent-tint panel. "Upgrade" starts a Stripe Checkout
// Session and redirects to Stripe's hosted page.

import { useState, useTransition } from "react";
import { Check, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/otterfund/logo";
import { Wordmark } from "@/components/otterfund/wordmark";
import type { OtterfundTheme } from "@/components/otterfund/theme";
import { gqlClient, errMessage } from "@/lib/graphql/client";
import {
  FEATURE_COPY,
  FEATURE_REQUIRED_TIER,
  PLAN_META,
  type Feature,
} from "@/lib/plans";

const CREATE_CHECKOUT = /* GraphQL */ `
  mutation CreateCheckout($tier: String!, $interval: String) {
    createCheckoutSession(tier: $tier, interval: $interval)
  }
`;

// Per-month price shown in the modal, mirroring the pricing page. Kept here as a
// light display hint only — Stripe is the source of truth for what's charged.
const TIER_PRICE: Record<string, { monthly: number; yearly: number }> = {
  standard: { monthly: 15, yearly: 120 },
  pro: { monthly: 20, yearly: 144 },
};

type Period = "monthly" | "yearly";

export function PaywallModal({
  open,
  onClose,
  feature,
  theme,
}: {
  open: boolean;
  onClose: () => void;
  /** The gated feature the user just tried to use. Null → modal stays closed. */
  feature: Feature | null;
  theme: OtterfundTheme;
}) {
  const [period, setPeriod] = useState<Period>("yearly");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!feature) return null;

  const copy = FEATURE_COPY[feature];
  const tier = FEATURE_REQUIRED_TIER[feature];
  const price = TIER_PRICE[tier] ?? TIER_PRICE.standard;
  const perMonth = period === "yearly" ? price.yearly / 12 : price.monthly;
  const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

  const upgrade = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await gqlClient.request<{ createCheckoutSession: string }>(
          CREATE_CHECKOUT,
          { tier, interval: period === "yearly" ? "year" : "month" },
        );
        // Hand off to Stripe's hosted checkout.
        window.location.href = res.createCheckoutSession;
      } catch (e) {
        setError(errMessage(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px] overflow-hidden p-0">
        {/* Accent-tint header band with the mark + a lock chip. */}
        <div
          className="relative px-7 pt-7 pb-6"
          style={{ background: theme.accentTint }}
        >
          <div className="flex items-center gap-2">
            <LogoMark size={30} />
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.07em]"
              style={{ background: "oklch(100% 0 0 / 0.6)", color: theme.accentDeep }}
            >
              <Lock className="h-3 w-3" strokeWidth={2.4} />
              {PLAN_META[tier].name} feature
            </span>
          </div>
          <DialogHeader className="mt-4">
            <DialogTitle
              className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-of-ink)]"
            >
              {copy.title}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1.5 max-w-[320px] text-[13.5px] leading-relaxed text-[var(--color-of-muted)]">
            {copy.blurb}
          </p>
        </div>

        <div className="px-7 pt-6 pb-7">
          {/* What the tier unlocks. */}
          <ul className="flex flex-col gap-2.5">
            {copy.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                  style={{ background: theme.accentTint, color: theme.accentDeep }}
                >
                  <Check className="h-3 w-3" strokeWidth={2.6} />
                </span>
                <span className="text-[13.5px] leading-snug text-[var(--color-of-ink)]">{perk}</span>
              </li>
            ))}
          </ul>

          {/* Monthly / yearly toggle + price. */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-end gap-1.5">
              <span className="of-num text-[30px] leading-none tracking-[-0.03em] text-[var(--color-of-ink)]" style={{ fontWeight: 500 }}>
                {money(perMonth)}
              </span>
              <span className="mb-1 text-[12.5px] font-medium text-[var(--color-of-muted)]">/ month</span>
            </div>
            <div className="inline-flex items-center rounded-full border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-0.5">
              {(["monthly", "yearly"] as const).map((p) => {
                const on = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    aria-pressed={on}
                    className="rounded-full px-3 py-1 text-[12px] font-semibold transition-colors"
                    style={on ? { background: theme.accent, color: "#fff" } : { color: "var(--color-of-muted)" }}
                  >
                    {p === "monthly" ? "Monthly" : "Yearly"}
                  </button>
                );
              })}
            </div>
          </div>
          {period === "yearly" && (
            <p className="mt-1.5 text-[12px] text-[var(--color-of-faint)]">
              Billed {money(price.yearly)} yearly.
            </p>
          )}

          {error && <p className="mt-3 text-[13px] font-medium text-[var(--color-of-clay)]">{error}</p>}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">
              Not now
            </Button>
            <Button
              size="sm"
              onClick={upgrade}
              disabled={isPending}
              className="flex-[2]"
              style={{ background: theme.accent }}
            >
              {isPending ? "Starting…" : `Upgrade to ${PLAN_META[tier].name}`}
            </Button>
          </div>
          <p className="mt-3 text-center text-[11.5px] text-[var(--color-of-faint)]">
            Secure checkout by Stripe · Cancel anytime · <Wordmark />
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
