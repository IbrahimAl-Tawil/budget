"use client";

// otterfund — pricing page.
//
// Three tiers in the brand's banknote language: warm surface cards, Newsreader
// figures, one evergreen accent, and the deep guilloché panel for the closing
// CTA. A Monthly / Yearly toggle re-prices the paid tiers (yearly shows the
// per-month equivalent + the amount billed once a year, with the saving). Pro
// is the featured tier — accent ring, "Most popular" pill, filled CTA.

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { gqlClient, errMessage } from "@/lib/graphql/client";
import { tierRank, type PlanTier } from "@/lib/plans";
import { CardLabel } from "@/components/otterfund/card";
import { GuillocheFlow } from "@/components/otterfund/guilloche-flow";
import { LogoMark } from "@/components/otterfund/logo";
import { Wordmark } from "@/components/otterfund/wordmark";
import { BRAND_THEME, SCHEMES } from "@/components/otterfund/theme";
import { TIERS, TierCard, type BillingPeriod, type Tier } from "@/components/otterfund/tier-card";
import { PANEL_ACCENT, PANEL_BG, PANEL_INK, PANEL_LINE, PANEL_LINE_DEEP } from "@/components/otterfund/brand-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SERIF: React.CSSProperties = { fontFamily: "var(--font-num), Georgia, serif" };
const T = BRAND_THEME;

const CREATE_CHECKOUT = /* GraphQL */ `
  mutation CreateCheckout($tier: String!, $interval: String) {
    createCheckoutSession(tier: $tier, interval: $interval)
  }
`;
const CREATE_PORTAL = /* GraphQL */ `
  mutation CreatePortal {
    createBillingPortalSession
  }
`;

// Marketing CTA copy per tier (the shared Tier model is context-agnostic).
const TIER_CTA: Record<string, string> = {
  free: "Start for free",
  standard: "Choose Standard",
  pro: "Choose Pro",
};

// The tier's call-to-action. Logged out → a link to sign up (carrying the plan
// + interval). Logged in → a live billing action: start Checkout for a first
// paid plan, or open the Stripe portal to switch/downgrade an existing one. The
// user's current tier reads as a non-interactive "Current plan".
function TierCta({
  tier,
  period,
  featured,
  authed,
  currentPlan,
  busy,
  onCheckout,
  onPortal,
}: {
  tier: Tier;
  period: BillingPeriod;
  featured: boolean;
  authed: boolean;
  currentPlan: PlanTier;
  busy: boolean;
  onCheckout: (tier: string, period: BillingPeriod) => void;
  onPortal: () => void;
}) {
  const cls = (variant: "default" | "outline") =>
    cn(buttonVariants({ variant, size: "lg" }), "mt-7 w-full font-semibold");

  // Logged out — keep the crawlable sign-up link, carrying the chosen interval.
  if (!authed) {
    const href =
      tier.id === "free"
        ? "/register"
        : `/register?plan=${tier.id}&interval=${period === "yearly" ? "year" : "month"}`;
    return (
      <Link href={href} className={cls(featured ? "default" : "outline")}>
        {TIER_CTA[tier.id] ?? "Get started"}
        {featured && <ArrowRight className="h-4 w-4" />}
      </Link>
    );
  }

  const isCurrent = currentPlan === tier.id;
  if (isCurrent) {
    // Free has no subscription to manage — it reads as a static marker. A paid
    // current plan links into the Stripe portal to manage or cancel.
    if (tier.id === "free") {
      return (
        <button
          type="button"
          disabled
          className={cn(cls("outline"), "cursor-default")}
          style={{ background: T.accentTint, borderColor: T.accentTintBorder, color: T.accentDeep }}
        >
          <Check className="h-4 w-4" strokeWidth={2.6} />
          Current plan
        </button>
      );
    }
    return (
      <button type="button" onClick={onPortal} disabled={busy} className={cls(featured ? "default" : "outline")}>
        {busy ? "Opening…" : "Manage plan"}
      </button>
    );
  }

  // Free card while on a paid plan → downgrade happens in the Stripe portal.
  if (tier.id === "free") {
    return (
      <button type="button" onClick={onPortal} disabled={busy} className={cls("outline")}>
        {busy ? "Opening…" : "Downgrade"}
      </button>
    );
  }

  // Paid card that isn't the current plan. First paid plan from Free → Checkout;
  // changing an existing paid plan → the portal. Higher tier reads "Upgrade",
  // a lower paid tier "Downgrade".
  const changingExisting = currentPlan !== "free";
  const label = tierRank(tier.id) > tierRank(currentPlan) ? "Upgrade" : "Downgrade";
  return (
    <button
      type="button"
      onClick={() => (changingExisting ? onPortal() : onCheckout(tier.id, period))}
      disabled={busy}
      className={cls(featured ? "default" : "outline")}
    >
      {busy ? "Starting…" : label}
      {featured && !busy && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

// Known in-app origins → the label shown on the "Back to <page>" return link.
// Only routes in this map get a tailored back link; anything else (or absent)
// falls back to the generic dashboard link, which also guards against an
// attacker-supplied `from` becoming an open redirect.
const BACK_LABELS: Record<string, string> = {
  "/dashboard": "dashboard",
  "/dashboard/transactions": "Transactions",
  "/dashboard/spending": "Spending",
  "/dashboard/accounts": "Accounts",
  "/dashboard/investments": "Investments",
  "/dashboard/goals": "Goals",
  "/dashboard/insights": "Insights",
};

export function PricingView({
  authed = false,
  currentPlan = "free",
  from,
}: {
  authed?: boolean;
  currentPlan?: PlanTier;
  /** Origin route (from `?from=`) so the nav offers a "Back to <page>" link. */
  from?: string;
} = {}) {
  const back = ((): { href: string; label: string } => {
    // `from` may carry a query (e.g. "/dashboard?settings=plan"). Only honor it
    // when the PATH is a known in-app route — never trust it for the label OR the
    // href. (A bare `!startsWith("//")` check isn't enough: the URL parser turns a
    // backslash into a slash, so `/\evil.com` would resolve off-site — hence the
    // allow-list on the path is the real guard against an open redirect.)
    if (from && from.startsWith("/")) {
      const [path, query = ""] = from.split("?");
      if (BACK_LABELS[path]) {
        const label = new URLSearchParams(query).has("settings") ? "Settings" : BACK_LABELS[path];
        return { href: from, label: `Back to ${label}` };
      }
    }
    return { href: "/dashboard", label: "Go to dashboard" };
  })();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Start a Stripe Checkout Session for a first paid plan and redirect to it.
  const handleCheckout = (tierId: string, p: BillingPeriod) => {
    setError("");
    startTransition(async () => {
      try {
        const res = await gqlClient.request<{ createCheckoutSession: string }>(CREATE_CHECKOUT, {
          tier: tierId,
          interval: p === "yearly" ? "year" : "month",
        });
        window.location.href = res.createCheckoutSession;
      } catch (e) {
        setError(errMessage(e));
      }
    });
  };

  // Open the Stripe billing portal to change or cancel an existing plan.
  const handlePortal = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await gqlClient.request<{ createBillingPortalSession: string }>(CREATE_PORTAL);
        window.location.href = res.createBillingPortalSession;
      } catch (e) {
        setError(errMessage(e));
      }
    });
  };

  return (
    <div className="of-paper min-h-screen bg-[var(--color-of-canvas)] text-[var(--color-of-ink)] overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-of-line-soft)] bg-[var(--color-of-canvas)]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-7 py-4">
          <Link href="/" aria-label="otterfund home" className="inline-flex items-center">
            <LogoMark size={52} />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {authed ? (
              <Link href={back.href} className={cn(buttonVariants({ variant: "default" }), "h-auto px-4 py-2 text-[13px]")}>
                {back.label}
              </Link>
            ) : (
              <>
                <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-auto px-4 py-2 text-[13px]")}>
                  Sign in
                </Link>
                <Link href="/register" className={cn(buttonVariants({ variant: "default" }), "h-auto px-4 py-2 text-[13px]")}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-[1120px] flex-col items-center px-7 pb-24">
        {/* ── Header ── */}
        <section className="relative w-full pt-16 pb-6 text-center sm:pt-24">
          <div className="of-lp-guilloche pointer-events-none absolute -inset-x-10 -top-10 bottom-0" aria-hidden>
            <GuillocheFlow accent={T.accent} accentDeep={T.accentDeep} fade="radial" opacity={0.06} speed={2} />
          </div>
          <div className="relative">
            <CardLabel className="justify-center">Pricing</CardLabel>
            <h1
              className="of-enter mx-auto mt-3 max-w-2xl text-[clamp(34px,5vw,56px)] leading-[1.05] tracking-[-0.03em] text-balance"
              style={{ ...SERIF, fontWeight: 500 }}
            >
              Simple pricing,{" "}
              <em className="text-[var(--color-primary)]" style={{ fontStyle: "italic" }}>
                for every stage.
              </em>
            </h1>
            <p className="of-enter mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[var(--color-of-muted)]">
              Start free. Upgrade when you want bank sync, an AI advisor, and your investments in one place.
            </p>

            {/* Monthly / Yearly toggle */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center rounded-full border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-1">
                {(["monthly", "yearly"] as const).map((p) => {
                  const on = period === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      aria-pressed={on}
                      className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
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
            </div>
          </div>
        </section>

        {/* ── Tier cards ── */}
        {/* Extra top margin so the otter poking over the featured card clears the
            Monthly / Yearly toggle above it. */}
        <section className="relative mt-24 flex w-full justify-center">
          {/* Backdrop that fills the plain canvas around the cards: a faint, wide
              guilloché field in the side gutters, fading before it reaches the
              cards (which sit opaque on top). */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-screen max-w-none -translate-x-1/2 -translate-y-1/2"
          >
            <GuillocheFlow accent={T.accent} accentDeep={T.accentDeep} opacity={0.07} fade="left" speed={2} gap={20} amp={10} />
            <GuillocheFlow accent={T.accent} accentDeep={T.accentDeep} opacity={0.07} fade="right" speed={2} gap={20} amp={10} />
          </div>

          <div className="relative grid w-full max-w-[1000px] gap-5 md:grid-cols-3 md:items-start">
            {TIERS.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                period={period}
                current={authed && currentPlan === tier.id}
                showOtter
              >
                <TierCta
                  tier={tier}
                  period={period}
                  featured={!!tier.featured}
                  authed={authed}
                  currentPlan={currentPlan}
                  busy={isPending}
                  onCheckout={handleCheckout}
                  onPortal={handlePortal}
                />
              </TierCard>
            ))}
          </div>
        </section>

        {error && (
          <p className="mt-6 text-center text-[13px] font-medium text-[var(--color-of-clay)]">{error}</p>
        )}

        {/* ── Trust line ── */}
        <p className="mt-10 text-center text-[12.5px] font-medium text-[var(--color-of-faint)]">
          All plans include bank-grade encryption. Cancel anytime.
        </p>
      </main>

      {/* ── Closing CTA — the deep evergreen brand panel ── */}
      <section className="relative overflow-hidden px-7 py-20 sm:py-24" style={{ background: PANEL_BG }}>
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <GuillocheFlow accent={PANEL_LINE} accentDeep={PANEL_LINE_DEEP} opacity={0.12} fade="none" speed={4} />
        </div>
        <div className="relative mx-auto max-w-[1120px] text-center">
          <div className="flex items-center justify-center gap-2.5" aria-hidden>
            {SCHEMES.map((s) => (
              <span key={s.name} className="h-2.5 w-2.5 rounded-full" style={{ background: s.value }} />
            ))}
          </div>
          <h2
            className="mx-auto mt-7 max-w-3xl text-[clamp(30px,5vw,52px)] leading-[1.06] tracking-[-0.03em] text-balance"
            style={{ ...SERIF, fontWeight: 500, color: PANEL_INK }}
          >
            Start free today,{" "}
            <em style={{ fontStyle: "italic", color: PANEL_ACCENT }}>upgrade whenever.</em>
          </h2>
          <div className="mt-9 flex justify-center">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-14 px-8 text-[16px] font-semibold bg-[oklch(97%_0.014_95)] text-[oklch(26%_0.055_155)]"
              )}
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-of-line-soft)] bg-[var(--color-of-canvas)] py-7">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 px-7 sm:flex-row">
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-of-muted)]">
            <LogoMark size={16} />
            <Wordmark />
          </div>
          <nav className="flex items-center gap-5 text-[12px]" aria-label="Footer">
            <Link href="/" className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]">
              Home
            </Link>
            <Link href="/login" className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]">
              Sign in
            </Link>
          </nav>
          <div className="flex items-center gap-2" aria-hidden>
            {SCHEMES.map((s) => (
              <span key={s.name} title={s.name} className="h-2.5 w-2.5 rounded-full" style={{ background: s.value }} />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
