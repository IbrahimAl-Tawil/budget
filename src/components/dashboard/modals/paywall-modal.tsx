"use client";

// The upgrade paywall — a small FLOW, not a screen (per the paywall playbook).
// When a Free (or under-tier) user triggers a gated action — Connect a bank, Add
// an investment — the chrome's `requireFeature` gate opens THIS modal, which
// walks three views:
//
//   1. OUTCOME — sells the future they get (no price yet). "See plans →".
//   2. OFFER   — the one tier that unlocks it, Annual (default) vs Monthly, the
//                price broken into a weekly anchor, perks, social proof, and a
//                CTA that starts Stripe Checkout in place. "View all plans"
//                escapes to /pricing for the full comparison.
//   3. EXIT    — a softer second chance shown only when the user tries to leave
//                the offer: start monthly instead of committing to a year.
//
// Copy is the single source in lib/plans (FEATURE_COPY + FEATURE_REQUIRED_TIER);
// pricing figures come from the shared TIERS model — so this never drifts from
// /pricing. No free trials anywhere (by product decision).

import { useEffect, useState } from "react";
import { ArrowRight, Check, Lock, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OtterFace } from "@/components/otterfund/logo";
import { Wordmark } from "@/components/otterfund/wordmark";
import { GuillocheFlow } from "@/components/otterfund/guilloche-flow";
import { SocialProofCompact } from "@/components/otterfund/social-proof";
import { TIERS, money, perWeek, savingsPct } from "@/components/otterfund/tier-card";
import type { OtterfundTheme } from "@/components/otterfund/theme";
import { FEATURE_COPY, FEATURE_REQUIRED_TIER, PLAN_META, type Feature, type PlanTier } from "@/lib/plans";

const SERIF: React.CSSProperties = { fontFamily: "var(--font-num), Georgia, serif" };

type Interval = "month" | "year";
type View = "outcome" | "offer" | "exit";

export function PaywallModal({
  open,
  feature,
  theme,
  onClose,
  onCheckout,
  onViewAllPlans,
}: {
  open: boolean;
  /** The gated feature to upsell — null when the modal is closed. */
  feature: Feature | null;
  theme: OtterfundTheme;
  onClose: () => void;
  /** Start Stripe Checkout for the given tier + interval (context wires this —
      the dashboard goes straight to Checkout; onboarding stashes resume state
      first). */
  onCheckout: (tier: PlanTier, interval: Interval) => void;
  /** Escape to the full /pricing comparison. */
  onViewAllPlans: () => void;
}) {
  const [view, setView] = useState<View>("outcome");
  const [interval, setInterval] = useState<Interval>("year");

  // Every fresh open (or feature change) starts at the outcome page on annual.
  useEffect(() => {
    if (open) {
      setView("outcome");
      setInterval("year");
    }
  }, [open, feature]);

  // Guard the null render AFTER hooks — the modal stays mounted (open toggles)
  // but `feature` is null while closed, so there's nothing to look up yet.
  if (!feature) return null;

  const copy = FEATURE_COPY[feature];
  const tier = FEATURE_REQUIRED_TIER[feature];
  const tierName = PLAN_META[tier].name;
  const tierData = TIERS.find((t) => t.id === tier) ?? TIERS[1];

  const perMonth = interval === "year" ? tierData.yearly / 12 : tierData.monthly;
  const savings = savingsPct(tierData);

  // Dismiss handling — leaving the OFFER first bounces through the exit-intent
  // second chance; every other view just closes. Backdrop, Esc and our own
  // controls all route here (the dialog's built-in ✕ is disabled).
  const handleDismiss = () => {
    if (view === "offer") setView("exit");
    else onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleDismiss()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-[440px] sm:p-0">
        {/* Our own dismiss — keeps exit-intent interception in one place. */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 grid h-8 w-8 place-items-center rounded-full text-[var(--color-of-muted)] transition-colors hover:bg-[oklch(0%_0_0/0.04)] hover:text-[var(--color-of-ink)]"
        >
          <X className="h-4 w-4" />
        </button>

        {view === "outcome" && (
          <OutcomeView
            copy={copy}
            tierName={tierName}
            theme={theme}
            onSeePlans={() => setView("offer")}
            onDismiss={handleDismiss}
          />
        )}

        {view === "offer" && (
          <OfferView
            copy={copy}
            tier={tier}
            tierName={tierName}
            theme={theme}
            interval={interval}
            setInterval={setInterval}
            perMonth={perMonth}
            savings={savings}
            onCheckout={onCheckout}
            onViewAllPlans={onViewAllPlans}
          />
        )}

        {view === "exit" && (
          <ExitView
            tierName={tierName}
            theme={theme}
            monthly={tierData.monthly}
            onStartMonthly={() => onCheckout(tier, "month")}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Shared header — the accent-tint field with the drifting guilloché texture,
//    the otter mark, and a "{Tier} feature" lock chip. ──
function PaywallHeader({
  theme,
  tierName,
  children,
}: {
  theme: OtterfundTheme;
  tierName: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden px-8 pt-9 pb-7 text-center"
      style={{ background: `linear-gradient(180deg, ${theme.accentTintBorder} 0%, ${theme.accentTint} 80%, transparent 100%)` }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <GuillocheFlow accent={theme.accent} accentDeep={theme.accentDeep} opacity={0.08} fade="radial" speed={3} />
      </div>
      <div className="relative">
        <div className="mx-auto flex items-center justify-center" style={{ color: theme.accentDeep }}>
          <OtterFace size={40} />
        </div>
        <span
          className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: theme.accentDeep }}
        >
          <Lock className="h-3 w-3" strokeWidth={2.4} />
          {tierName} feature
        </span>
        {children}
      </div>
    </div>
  );
}

// ── View 1: OUTCOME — sell the future, no price. ──
function OutcomeView({
  copy,
  tierName,
  theme,
  onSeePlans,
  onDismiss,
}: {
  copy: (typeof FEATURE_COPY)[Feature];
  tierName: string;
  theme: OtterfundTheme;
  onSeePlans: () => void;
  onDismiss: () => void;
}) {
  return (
    <>
      <PaywallHeader theme={theme} tierName={tierName}>
        <DialogTitle
          className="mt-3 text-[26px] leading-[1.1] tracking-[-0.02em] text-[var(--color-of-ink)]"
          style={{ ...SERIF, fontWeight: 500 }}
        >
          {copy.outcome.headline}
        </DialogTitle>
        <DialogDescription className="mx-auto mt-2 max-w-[340px] text-[13.5px] leading-relaxed text-[var(--color-of-muted)]">
          {copy.outcome.sub}
        </DialogDescription>
      </PaywallHeader>

      <div className="px-8 pt-6 pb-8">
        <ul className="mx-auto flex max-w-[320px] flex-col gap-3">
          {copy.outcome.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <span
                className="mt-[1px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full"
                style={{ background: theme.accentTint, color: theme.accentDeep }}
              >
                <Check className="h-3 w-3" strokeWidth={2.6} />
              </span>
              <span className="text-[13.5px] leading-snug text-[var(--color-of-ink)]">{b}</span>
            </li>
          ))}
        </ul>

        <Button size="lg" onClick={onSeePlans} className="mt-7 w-full font-semibold" style={{ background: theme.accent }}>
          See plans <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="link" size="sm" onClick={onDismiss} className="mx-auto mt-3 flex text-[12.5px]">
          Not now
        </Button>
      </div>
    </>
  );
}

// ── View 2: OFFER — one tier, Annual (default) vs Monthly, weekly anchor. ──
function OfferView({
  copy,
  tier,
  tierName,
  theme,
  interval,
  setInterval,
  perMonth,
  savings,
  onCheckout,
  onViewAllPlans,
}: {
  copy: (typeof FEATURE_COPY)[Feature];
  tier: PlanTier;
  tierName: string;
  theme: OtterfundTheme;
  interval: Interval;
  setInterval: (i: Interval) => void;
  perMonth: number;
  savings: number;
  onCheckout: (tier: PlanTier, interval: Interval) => void;
  onViewAllPlans: () => void;
}) {
  return (
    <>
      <PaywallHeader theme={theme} tierName={tierName}>
        <DialogTitle
          className="mt-3 text-[24px] leading-[1.1] tracking-[-0.02em] text-[var(--color-of-ink)]"
          style={{ ...SERIF, fontWeight: 500 }}
        >
          Unlock {tierName}
        </DialogTitle>
        <DialogDescription className="sr-only">Choose annual or monthly billing for the {tierName} plan.</DialogDescription>
      </PaywallHeader>

      <div className="px-8 pt-6 pb-7">
        {/* Annual (default) vs Monthly — the two options, no more. */}
        <div className="inline-grid w-full grid-cols-2 items-center rounded-full border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-1">
          {(["year", "month"] as const).map((i) => {
            const on = interval === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setInterval(i)}
                aria-pressed={on}
                className="inline-flex w-full items-center justify-center rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors"
                style={on ? { background: theme.accent, color: "#fff" } : { color: "var(--color-of-muted)" }}
              >
                {i === "year" ? "Annual" : "Monthly"}
                {i === "year" && (
                  <span
                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={on ? { background: "oklch(100% 0 0 / 0.22)", color: "#fff" } : { background: theme.accentTint, color: theme.accentDeep }}
                  >
                    Save {savings}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Price + weekly anchor. */}
        <div className="mt-5 flex items-end gap-1.5">
          <span className="of-num text-[40px] leading-none tracking-[-0.03em]" style={{ fontWeight: 500 }}>
            {money(Math.round(perMonth * 100) / 100)}
          </span>
          <span className="mb-1.5 text-[14px] font-medium text-[var(--color-of-muted)]">/ month</span>
        </div>
        <div className="mt-1.5 text-[12.5px] font-medium text-[var(--color-of-muted)]">
          {interval === "year" ? (
            <>
              Billed yearly · <span style={{ color: theme.accentDeep }}>about {perWeek(perMonth)} a week</span>
            </>
          ) : (
            <>about {perWeek(perMonth)} a week · billed monthly</>
          )}
        </div>

        {/* Perks. */}
        <ul className="mt-5 flex flex-col gap-2.5 border-t border-[var(--color-of-line-soft)] pt-5">
          {copy.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5">
              <span
                className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                style={{ background: theme.accentTint, color: theme.accentDeep }}
              >
                <Check className="h-3 w-3" strokeWidth={2.6} />
              </span>
              <span className="text-[13px] leading-snug text-[var(--color-of-ink)]">{perk}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-[var(--color-of-line-soft)] pt-4">
          <SocialProofCompact theme={theme} />
        </div>

        <Button
          size="lg"
          onClick={() => onCheckout(tier, interval)}
          className="mt-5 w-full font-semibold"
          style={{ background: theme.accent }}
        >
          Get {tierName} <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="mt-3 text-center text-[11.5px] text-[var(--color-of-faint)]">No commitment · cancel anytime</p>
        <button
          type="button"
          onClick={onViewAllPlans}
          className="mx-auto mt-3 flex text-[12.5px] font-medium text-[var(--color-of-muted)] underline-offset-2 transition-colors hover:text-[var(--color-of-ink)] hover:underline"
        >
          View all plans
        </button>
      </div>
    </>
  );
}

// ── View 3: EXIT-INTENT — the softer second chance (start monthly). ──
function ExitView({
  tierName,
  theme,
  monthly,
  onStartMonthly,
  onClose,
}: {
  tierName: string;
  theme: OtterfundTheme;
  monthly: number;
  onStartMonthly: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <PaywallHeader theme={theme} tierName={tierName}>
        <DialogTitle
          className="mt-3 text-[24px] leading-[1.12] tracking-[-0.02em] text-[var(--color-of-ink)]"
          style={{ ...SERIF, fontWeight: 500 }}
        >
          Not ready for a year?
        </DialogTitle>
        <DialogDescription className="mx-auto mt-2 max-w-[320px] text-[13.5px] leading-relaxed text-[var(--color-of-muted)]">
          Start monthly instead. Just {money(monthly)}/month, and you can cancel anytime.
        </DialogDescription>
      </PaywallHeader>

      <div className="px-8 pt-6 pb-8">
        <Button size="lg" onClick={onStartMonthly} className="w-full font-semibold" style={{ background: theme.accent }}>
          Start monthly · {money(monthly)}/mo <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="link" size="sm" onClick={onClose} className="mx-auto mt-3 flex text-[12.5px]">
          No thanks
        </Button>
        <p className="mt-3 text-center text-[11.5px] text-[var(--color-of-faint)]">
          Cancel anytime · <Wordmark />
        </p>
      </div>
    </>
  );
}
