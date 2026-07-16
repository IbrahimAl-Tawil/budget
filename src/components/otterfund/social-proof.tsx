"use client";

// otterfund — social proof.
//
// ONE source for the trust block shown on the pricing page and the paywall's
// offer page, so the two never drift. Two registers:
//  · the mechanism stat — the outcome otterfund delivers by DESIGN (auto-saving
//    a share of every paycheck). True today, not a claimed aggregate.
//  · a rating + a couple of short testimonials.
//
// The testimonials + rating are illustrative placeholders — swap them for real
// quotes/ratings before launch. They live here in ONE const so there's a single
// place to do it.

import { Star } from "lucide-react";

import { BRAND_THEME, type OtterfundTheme } from "@/components/otterfund/theme";
import { cn } from "@/lib/utils";

const SERIF: React.CSSProperties = { fontFamily: "var(--font-num), Georgia, serif" };

export interface Testimonial {
  quote: string;
  name: string;
  meta: string;
}

/** Illustrative until real data lands — see file header. */
export const SOCIAL_PROOF = {
  /** Mechanism stat: what the app does, phrased as the outcome. The default
      50/30/20 plan routes 20% of income to savings — so this is honest, not an
      aggregate claim. */
  stat: {
    lead: "Save 20% of every paycheck",
    emphasis: "automatically.",
  },
  rating: 4.8,
  ratingNote: "loved by early otters",
  testimonials: [
    {
      quote: "Saved more in three months than I did all last year.",
      name: "Maya R.",
      meta: "Standard member",
    },
    {
      quote: "The bank sync just works. I stopped dreading opening my budget.",
      name: "Devin K.",
      meta: "Pro member",
    },
  ] as Testimonial[],
};

/** Five stars with the rating figure. Filled stars use the active accent so the
    row stays on-brand rather than defaulting to a generic amber. */
export function StarRow({
  theme = BRAND_THEME,
  rating = SOCIAL_PROOF.rating,
  note = SOCIAL_PROOF.ratingNote,
  className,
}: {
  theme?: OtterfundTheme;
  rating?: number;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-[15px] w-[15px]" strokeWidth={0} fill={theme.accentDeep} />
        ))}
      </span>
      <span className="of-num text-[13px] font-semibold text-[var(--color-of-ink)]">
        {rating.toFixed(1)}
      </span>
      {note && <span className="text-[13px] text-[var(--color-of-muted)]">· {note}</span>}
    </div>
  );
}

/** The mechanism stat set as a display line (Newsreader), accent on the payoff. */
export function MechanismStat({
  theme = BRAND_THEME,
  className,
  size = "lg",
}: {
  theme?: OtterfundTheme;
  className?: string;
  size?: "lg" | "sm";
}) {
  return (
    <p
      className={cn(
        "leading-[1.1] tracking-[-0.02em] text-[var(--color-of-ink)] text-balance",
        size === "lg" ? "text-[clamp(24px,3.4vw,34px)]" : "text-[19px]",
        className,
      )}
      style={{ ...SERIF, fontWeight: 500 }}
    >
      {SOCIAL_PROOF.stat.lead}{" "}
      <em style={{ fontStyle: "italic", color: theme.accentDeep }}>{SOCIAL_PROOF.stat.emphasis}</em>
    </p>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="rounded-[18px] border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-5 text-left">
      <blockquote className="text-[14px] leading-relaxed text-[var(--color-of-ink)]">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-3 text-[12px] font-medium text-[var(--color-of-muted)]">
        {t.name} <span className="text-[var(--color-of-faint)]">· {t.meta}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Full social-proof block for the marketing pricing page: the mechanism stat,
 * the rating row, and two testimonial cards.
 */
export function SocialProof({ theme = BRAND_THEME }: { theme?: OtterfundTheme }) {
  return (
    <div className="mx-auto w-full max-w-[720px] text-center">
      <MechanismStat theme={theme} />
      <StarRow theme={theme} className="mt-6" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SOCIAL_PROOF.testimonials.map((t) => (
          <TestimonialCard key={t.name} t={t} />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact proof for the paywall offer page — the rating row plus a single short
 * testimonial, tight enough to sit inside the modal without a scroll.
 */
export function SocialProofCompact({ theme = BRAND_THEME }: { theme?: OtterfundTheme }) {
  const t = SOCIAL_PROOF.testimonials[0];
  return (
    <div className="text-center">
      <StarRow theme={theme} note="" />
      <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] leading-snug text-[var(--color-of-muted)]">
        &ldquo;{t.quote}&rdquo; <span className="text-[var(--color-of-faint)]">&ndash; {t.name}</span>
      </p>
    </div>
  );
}
