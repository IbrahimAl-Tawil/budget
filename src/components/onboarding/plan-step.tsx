"use client";

// otterfund — onboarding plan step.
//
// The first thing a new user sees in the wizard: pick a tier. Free continues
// straight into the setup flow; a paid tier hands off to Stripe Checkout (the
// wizard owns that call) and returns to `/onboarding?checkout=…` to resume.
// Renders the SAME banknote card as /pricing (from components/otterfund/
// tier-card) in `compact` mode, so the two surfaces never drift — only the CTA
// and layout differ here.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TIERS, TierCard, type BillingPeriod, type Tier } from "@/components/otterfund/tier-card";
import { BRAND_THEME } from "@/components/otterfund/theme";
import { type PlanTier } from "@/lib/plans";

const T = BRAND_THEME;

const HEADING_CLASS =
  "text-2xl sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.05] text-[var(--color-of-ink)] mb-2";

export function PlanStep({
  currentPlan,
  busyTier,
  canceled,
  onContinue,
  onCheckout,
}: {
  /** The user's tier from the DB — set once a paid Checkout's webhook lands. */
  currentPlan: PlanTier;
  /** Tier id whose Checkout is currently starting (disables that button). */
  busyTier: string | null;
  /** Returned from a canceled Stripe Checkout — show a gentle nudge. */
  canceled: boolean;
  /** Proceed into the setup flow without paying (Free, or an already-paid tier). */
  onContinue: () => void;
  /** Start Stripe Checkout for a paid tier. */
  onCheckout: (tier: PlanTier, interval: "month" | "year") => void;
}) {
  const [period, setPeriod] = useState<BillingPeriod>("yearly");

  return (
    <div className="of-enter">
      <h2 className={HEADING_CLASS}>Choose your plan</h2>
      <p className="mb-5 text-sm text-[var(--color-of-muted)]">
        Start free, or unlock bank sync and AI. You can change plans anytime in Settings.
      </p>

      {canceled && (
        <div className="mb-5 rounded-xl border border-[var(--color-of-line)] bg-[oklch(98%_0.004_90)] px-4 py-3 text-[13px] text-[var(--color-of-muted)]">
          No charge was made. Pick a plan to keep going — Free works too.
        </div>
      )}

      {/* Monthly / Yearly toggle — an equal-width 2-column pill so the "Save"
          badge on Yearly doesn't make that tab wider than Monthly. */}
      <div className="mb-6 inline-grid grid-cols-2 items-center rounded-full border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-1">
        {(["monthly", "yearly"] as const).map((p) => {
          const on = period === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              aria-pressed={on}
              className="inline-flex w-full items-center justify-center rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
              style={on ? { background: T.accent, color: "#fff" } : { color: "var(--color-of-muted)" }}
            >
              {p === "monthly" ? "Monthly" : "Yearly"}
              {p === "yearly" && (
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold"
                  style={on ? { background: "oklch(100% 0 0 / 0.22)", color: "#fff" } : { background: T.accentTint, color: T.accentDeep }}
                >
                  Save up to 40%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* lg:mt-16 leaves headroom for the otter poking over the featured card. */}
      <div className="grid gap-4 lg:mt-16 lg:grid-cols-3 lg:items-start">
        {TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            period={period}
            compact
            showOtter
            // Only a real paid subscription reads as "current" — Free is the
            // default state during onboarding, not a chosen plan.
            current={tier.id === currentPlan && currentPlan !== "free"}
          >
            <PlanCta
              tier={tier}
              period={period}
              currentPlan={currentPlan}
              busy={busyTier === tier.id}
              onContinue={onContinue}
              onCheckout={onCheckout}
            />
          </TierCard>
        ))}
      </div>
    </div>
  );
}

function PlanCta({
  tier,
  period,
  currentPlan,
  busy,
  onContinue,
  onCheckout,
}: {
  tier: Tier;
  period: BillingPeriod;
  currentPlan: PlanTier;
  busy: boolean;
  onContinue: () => void;
  onCheckout: (tier: PlanTier, interval: "month" | "year") => void;
}) {
  const featured = !!tier.featured;
  const cls = "mt-6 w-full font-semibold";

  // Already on this paid tier (Checkout done, webhook landed) → just continue.
  if (tier.id === currentPlan && currentPlan !== "free") {
    return (
      <Button size="sm" onClick={onContinue} className={cls}>
        Continue with {tier.name}
      </Button>
    );
  }
  // Free → straight into the setup flow, no payment.
  if (tier.id === "free") {
    return (
      <Button variant="outline" size="sm" onClick={onContinue} className={cls}>
        Continue free
      </Button>
    );
  }
  // Paid → hand off to Stripe Checkout.
  return (
    <Button
      variant={featured ? "default" : "outline"}
      size="sm"
      disabled={busy}
      onClick={() => onCheckout(tier.id, period === "yearly" ? "year" : "month")}
      className={cls}
    >
      {busy ? "Starting…" : `Choose ${tier.name}`}
    </Button>
  );
}
