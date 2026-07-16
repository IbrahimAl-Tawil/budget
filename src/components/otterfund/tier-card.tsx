"use client";

// otterfund — shared plan tier card + pricing model.
//
// ONE banknote-language pricing card, used by both the marketing /pricing page
// and the onboarding plan step, so the two never drift. The card owns the visual
// treatment — layered paper surface, accent ring + "Most popular" / "Current"
// pill, the animated price figure, the etched-corner hatch, the feature list —
// and takes the call-to-action as `children`, because the CTA differs by context
// (Checkout/portal on /pricing; continue/checkout in onboarding).
//
// `compact` tightens paddings + the price figure for the narrower onboarding
// column. Pricing figures live here (the marketing source of truth); the gated
// capabilities themselves live in lib/plans.

import { useEffect, useId, useRef, useState } from "react";
import { Check, Minus } from "lucide-react";

import { BRAND_THEME } from "@/components/otterfund/theme";
import { cn } from "@/lib/utils";
import { type PlanTier } from "@/lib/plans";
// The otter poking over the top of the featured card — pre-tinted coral to
// match the brand mark (see otter-poking.png).
import otterPoking from "@/components/otterfund/otter-poking.png";

const T = BRAND_THEME;

export type BillingPeriod = "monthly" | "yearly";

export interface TierFeature {
  text: string;
  included: boolean;
  /** Renders bold — the "Everything in X" lead-in row. */
  lead?: boolean;
}

export interface Tier {
  id: PlanTier;
  name: string;
  tagline: string;
  /** Price per month, billed monthly. */
  monthly: number;
  /** Total price billed once per year (0 for Free). */
  yearly: number;
  featured?: boolean;
  features: TierFeature[];
}

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to start budgeting.",
    monthly: 0,
    yearly: 0,
    features: [
      { text: "Unlimited manual accounts & transactions", included: true },
      { text: "Goals & savings allocation", included: true },
      { text: "Spending breakdown & budgets", included: true },
      { text: "Automatic bank sync", included: false },
      { text: "AI advisor & insights", included: false },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Automatic bank sync and an AI advisor.",
    monthly: 15,
    yearly: 120,
    featured: true,
    features: [
      { text: "Everything in Free, plus", included: true, lead: true },
      { text: "Connect up to 3 bank accounts", included: true },
      { text: "Automatic sync & categorization", included: true },
      { text: "AI advisor: 20 chats a month", included: true },
      { text: "10 AI insight refreshes a month", included: true },
      { text: "Investment tracking", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "The full picture, investments and all.",
    monthly: 20,
    yearly: 144,
    features: [
      { text: "Everything in Standard, plus", included: true, lead: true },
      { text: "Connect up to 10 bank accounts", included: true },
      { text: "Unlimited AI chats & insights", included: true },
      { text: "Investment tracking & net worth", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

/** "$10" or "$12.50" — drop the cents when it's a round dollar. */
export function money(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Yearly discount as a whole percent vs. paying monthly for 12 months. */
export function savingsPct(t: Tier): number {
  if (!t.monthly) return 0;
  return Math.round((1 - t.yearly / (t.monthly * 12)) * 100);
}

/** Price anchored to a small weekly number (the guide's "break it into weekly
    amounts"). Derived from the per-month figure actually shown, so it tracks the
    selected billing period. */
export function perWeek(perMonth: number): string {
  return money(Math.round(((perMonth * 12) / 52) * 100) / 100);
}

// Mobile stacking order — lead with the most-popular (featured) tier and push
// Free to the bottom so the paid plans aren't buried below the fold on phones.
// Order resets to DOM order (Free · Standard · Pro) once the cards sit in a row.
// Literal class strings so Tailwind's JIT picks them up. Pass the breakpoint the
// parent grid becomes a row at ("md" on /pricing, "lg" in onboarding).
const MOBILE_ORDER: Record<string, { md: string; lg: string }> = {
  standard: { md: "order-first md:order-none", lg: "order-first lg:order-none" },
  pro: { md: "order-2 md:order-none", lg: "order-2 lg:order-none" },
  free: { md: "order-last md:order-none", lg: "order-last lg:order-none" },
};
export function tierOrderClass(tierId: string, bp: "md" | "lg"): string {
  return MOBILE_ORDER[tierId]?.[bp] ?? "";
}

// How fast the count runs and how much the digits smear while they spin.
const ROLL_DUR = 520; // ms — quick, slot-machine snappy
const ROLL_MAX_BLUR = 2; // px of vertical smear right after a digit flips
const ROLL_BLUR_TAIL = 90; // ms a digit keeps smearing after it last flipped

/** The price figure as an animated count. When Monthly/Yearly toggles, the number
    tweens from its previous value to the new one with an eased ramp, while each
    digit smears vertically as it flips, so it reads like a slot-machine reel
    spinning to a stop. Honors prefers-reduced-motion (instant swap). */
export function RollingPrice({
  amount,
  className,
  style,
}: {
  amount: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const whole = Number.isInteger(amount);
  const fmt = (v: number) => money(whole ? Math.round(v) : Math.round(v * 100) / 100);

  const [display, setDisplay] = useState(amount);
  // Per-character blur in px, aligned to the formatted string.
  const [blurs, setBlurs] = useState<number[]>([]);
  const target = useRef(amount);
  const cur = useRef(amount);
  const raf = useRef(0);
  const prevChars = useRef<string[]>([]);
  const lastFlip = useRef<number[]>([]); // timestamp each position last changed
  // Unique, selector-safe id so each card's reels get their own blur filters.
  const filterId = "of-roll-" + useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    if (amount === target.current) return;
    target.current = amount;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cur.current = amount;
      setDisplay(amount);
      setBlurs([]);
      return;
    }
    const start = cur.current;
    const end = amount;
    prevChars.current = fmt(start).split("");
    lastFlip.current = prevChars.current.map(() => -Infinity);
    const t0 = performance.now();
    cancelAnimationFrame(raf.current);
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ROLL_DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (end - start) * eased;
      cur.current = v;
      setDisplay(v);
      if (p >= 1) {
        setBlurs([]); // land crisp
        return;
      }
      const s = fmt(v).split("");
      const nb = s.map((ch, i) => {
        if (ch !== prevChars.current[i]) lastFlip.current[i] = t;
        if (ch < "0" || ch > "9") return 0;
        const since = t - (lastFlip.current[i] ?? -Infinity);
        return since >= ROLL_BLUR_TAIL ? 0 : ROLL_MAX_BLUR * (1 - since / ROLL_BLUR_TAIL);
      });
      prevChars.current = s;
      setBlurs(nb);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // Only react to an incoming `amount`; `fmt` is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const chars = fmt(display).split("");
  return (
    <span className={className} style={style}>
      <svg width="0" height="0" aria-hidden className="absolute">
        {chars.map((_, i) => (
          <filter key={i} id={`${filterId}-${i}`} x="-20%" y="-70%" width="140%" height="240%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`0 ${(blurs[i] ?? 0).toFixed(2)}`} />
          </filter>
        ))}
      </svg>
      {chars.map((ch, i) => {
        const doBlur = (blurs[i] ?? 0) > 0.05;
        return (
          <span
            key={i}
            style={{
              filter: doBlur ? `url(#${filterId}-${i})` : undefined,
              willChange: doBlur ? "filter" : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export function PriceBlock({
  tier,
  period,
  compact = false,
  anchor = false,
}: {
  tier: Tier;
  period: BillingPeriod;
  compact?: boolean;
  /** Show the small "about $X a week" price anchor beneath the figure. */
  anchor?: boolean;
}) {
  // Free is always $0. Paid tiers show the per-month figure; yearly divides the
  // annual price by 12 so both periods read as "/month".
  const perMonth = tier.monthly === 0 ? 0 : period === "yearly" ? tier.yearly / 12 : tier.monthly;

  return (
    <div>
      <div className="flex items-end gap-1.5">
        <RollingPrice
          amount={perMonth}
          className={cn(
            "of-num leading-none",
            compact ? "text-[32px] tracking-[-0.02em]" : "text-[44px] tracking-[-0.03em]",
          )}
          style={{ fontWeight: 500 }}
        />
        <span className={cn("font-medium text-[var(--color-of-muted)]", compact ? "mb-1 text-[12.5px]" : "mb-1.5 text-[14px]")}>
          {tier.monthly === 0 ? "forever" : compact ? "/mo" : "/ month"}
        </span>
      </div>

      {/* Price anchor — the figure broken into a small weekly number. Free keeps
          the row (a non-breaking space) so paid/free cards stay aligned. */}
      {anchor && (
        <div className={cn("font-medium text-[var(--color-of-faint)]", compact ? "mt-1 text-[11.5px]" : "mt-1.5 text-[12px]")}>
          {tier.monthly === 0 ? " " : `about ${perWeek(perMonth)} a week`}
        </div>
      )}

      {/* Sub-line: annual billing note or the yearly-saving nudge. */}
      <div className={cn("font-medium", compact ? "mt-1.5 h-4 text-[12px]" : "mt-2 h-4 text-[12.5px]")}>
        {tier.monthly === 0 ? (
          <span className="text-[var(--color-of-faint)]">No credit card required</span>
        ) : period === "yearly" ? (
          <span className="text-[var(--color-of-muted)]">
            {money(perMonth)}/month billed yearly ·{" "}
            <span style={{ color: T.accentDeep }}>save {savingsPct(tier)}%</span>
          </span>
        ) : (
          <span className="text-[var(--color-of-faint)]">Switch to yearly to save {savingsPct(tier)}%</span>
        )}
      </div>
    </div>
  );
}

// "Money stroke" hues for the corner etch — the Canadian banknote palette:
// Free = $5 blue, Standard = $20 green (the brand hue), Pro = coral (the mark).
const TIER_STROKES: Record<string, [string, string]> = {
  free: ["#1f74bf", "#0059a7"],
  standard: ["#007e4b", "#006130"],
  pro: ["#e55647", "#c44134"],
};

// Reveal the etch only around the border — denser blocks in the four corners,
// joined by a fine line along each edge — so the middle stays white, like the
// engraved frame of a banknote. Multiple mask layers union (mask-composite: add).
const ETCH_MASK = [
  "radial-gradient(130px 110px at 0% 0%, #000, transparent 66%)",
  "radial-gradient(130px 110px at 100% 0%, #000, transparent 66%)",
  "radial-gradient(130px 110px at 0% 100%, #000, transparent 66%)",
  "radial-gradient(130px 110px at 100% 100%, #000, transparent 66%)",
  "linear-gradient(to bottom, #000, transparent 7%)",
  "linear-gradient(to top, #000, transparent 7%)",
  "linear-gradient(to right, #000, transparent 5%)",
  "linear-gradient(to left, #000, transparent 5%)",
].join(", ");

/**
 * The banknote pricing card. Presentation only — pass the call-to-action as
 * `children`. `current` shows the "Current plan" ring + badge (takes precedence
 * over the featured "Most popular" tag). `showOtter` renders the otter poking
 * over the featured card (marketing page only). `compact` tightens spacing for
 * the onboarding column and drops the featured scale-up.
 */
export function TierCard({
  tier,
  period,
  current = false,
  showOtter = false,
  compact = false,
  featureLimit,
  anchor = false,
  className,
  children,
}: {
  tier: Tier;
  period: BillingPeriod;
  current?: boolean;
  showOtter?: boolean;
  compact?: boolean;
  /** Cap the feature list to the first N rows — keeps the compact onboarding
      cards from running tall. Unset (the /pricing page) shows every feature. */
  featureLimit?: number;
  /** Show the "about $X a week" price anchor beneath the figure. */
  anchor?: boolean;
  /** Extra classes on the card root — e.g. the responsive mobile-order class. */
  className?: string;
  children: React.ReactNode;
}) {
  const featured = !!tier.featured;
  const features = featureLimit ? tier.features.slice(0, featureLimit) : tier.features;
  const [strokeLine, strokeDeep] = TIER_STROKES[tier.id] ?? TIER_STROKES.standard;
  // A tiny tile of two dashed diagonals → a cross-hatch of short strokes when
  // tiled. The dash pattern keeps each mark tiny.
  const etchTile = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><g stroke-width='0.7' stroke-linecap='round'><line x1='0' y1='0' x2='12' y2='12' stroke='${strokeLine}' stroke-dasharray='1.6 2.8'/><line x1='12' y1='0' x2='0' y2='12' stroke='${strokeDeep}' stroke-dasharray='1.6 2.8'/></g></svg>`,
  )}`;
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[24px]",
        compact ? "p-6" : "p-7 sm:p-8",
        // The featured tier sits slightly larger and lifted toward the viewer —
        // but not in compact (onboarding), where the row stays aligned.
        featured && !compact && "md:z-10 md:scale-[1.045] md:-translate-y-1",
        className,
      )}
      style={{
        background: featured
          ? `radial-gradient(135% 90% at 88% -14%, ${T.accentTint} 0%, transparent 52%), linear-gradient(180deg, oklch(100% 0 0 / 0.55), oklch(100% 0 0 / 0) 42%), var(--color-of-surface)`
          : "linear-gradient(180deg, oklch(100% 0 0 / 0.5), oklch(100% 0 0 / 0) 40%), var(--color-of-surface)",
        border: featured
          ? `1.5px solid ${T.accent}`
          : current
            ? `1.5px solid ${T.accentBorder}`
            : "1px solid var(--color-of-line)",
        boxShadow: featured
          ? "inset 0 1px 0 oklch(100% 0 0 / 0.9), 0 0 0 1px oklch(66% 0.17 29 / 0.12), 0 6px 34px oklch(66% 0.17 29 / 0.16), 0 30px 70px oklch(20% 0.04 160 / 0.16)"
          : current
            ? `inset 0 1px 0 oklch(100% 0 0 / 0.8), 0 0 0 3px ${T.accentTint}, 0 14px 34px oklch(20% 0.02 80 / 0.07)`
            : "inset 0 1px 0 oklch(100% 0 0 / 0.8), 0 1px 3px oklch(20% 0.02 80 / 0.05), 0 14px 34px oklch(20% 0.02 80 / 0.07)",
      }}
    >
      {/* "Money strokes" — a fine engraved cross-hatch worked into the corners
          and joined by a hairline along each edge, tinted per tier. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-30"
        style={{
          maskImage: ETCH_MASK,
          WebkitMaskImage: ETCH_MASK,
          backgroundImage: `url("${etchTile}")`,
          backgroundSize: "9px 9px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* The otter pokes over the top edge of the featured card. Purely
          decorative; marketing page only. */}
      {showOtter && featured && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={otterPoking.src}
          alt=""
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-1/2 top-0 z-10 w-[210px] max-w-none -translate-x-1/2 -translate-y-[80%]",
            // In the compact (onboarding) grid the cards stack below lg, where a
            // poking otter would overlap the card above — only show it once the
            // cards sit in a row.
            compact && "hidden lg:block",
          )}
          style={{ filter: "drop-shadow(0 8px 10px oklch(20% 0.04 160 / 0.14))" }}
        />
      )}

      {/* Top-right badge. The current-plan marker takes precedence over the
          "Most popular" marketing tag. */}
      {current ? (
        <span
          className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-[5px] text-[10px] font-semibold uppercase tracking-[0.07em]"
          style={{ background: T.accentTint, color: T.accentDeep, boxShadow: `inset 0 0 0 1px ${T.accentTintBorder}` }}
        >
          <Check className="h-3 w-3" strokeWidth={2.8} />
          Current plan
        </span>
      ) : featured ? (
        // Compact (onboarding) cards are narrow — a shorter "Popular" tag with
        // tighter padding keeps the badge off the plan name.
        <span
          className={cn(
            "absolute z-20 rounded-full font-semibold uppercase tracking-[0.07em]",
            compact ? "right-3 top-3 px-2 py-1 text-[9px]" : "right-4 top-4 px-2.5 py-[5px] text-[10px]",
          )}
          style={{ background: T.accent, color: "#fff", boxShadow: "0 3px 8px oklch(20% 0.04 160 / 0.2)" }}
        >
          {compact ? "Popular" : "Most popular"}
        </span>
      ) : null}

      <div className="relative z-[1] flex flex-col">
        {/* Reserve room on the right so a top-right badge never crowds the name. */}
        <div className={cn("pr-16 font-semibold tracking-[-0.01em] text-[var(--color-of-ink)]", compact ? "text-[17px]" : "text-[18px]")}>
          {tier.name}
        </div>
        <p className={cn("mt-1 min-h-[40px] max-w-[240px] leading-relaxed text-[var(--color-of-muted)]", compact ? "text-[12.5px]" : "text-[13px]")}>
          {tier.tagline}
        </p>

        <div className={compact ? "mt-4" : "mt-5"}>
          <PriceBlock tier={tier} period={period} compact={compact} anchor={anchor} />
        </div>

        {children}

        <ul
          className={cn(
            "flex flex-col border-t border-[var(--color-of-line-soft)]",
            compact ? "mt-6 gap-2.5 pt-6" : "mt-7 gap-3.5 pt-7",
          )}
        >
          {features.map((f) => (
            <li key={f.text} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                style={
                  f.included
                    ? { background: T.accentTint, color: T.accentDeep }
                    : { background: "oklch(96% 0.004 85)", color: "var(--color-of-faint)" }
                }
              >
                {f.included ? <Check className="h-3 w-3" strokeWidth={2.6} /> : <Minus className="h-3 w-3" strokeWidth={2.4} />}
              </span>
              <span
                className={cn(
                  "leading-snug",
                  compact ? "text-[12.5px]" : "text-[13.5px]",
                  f.included ? "text-[var(--color-of-ink)]" : "text-[var(--color-of-faint)]",
                  f.lead && "font-semibold",
                )}
              >
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
