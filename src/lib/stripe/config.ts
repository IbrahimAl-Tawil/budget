import "server-only";
import type { PlanTier } from "@/lib/plans";

// Maps our plan tiers ⇄ Stripe Price IDs, both directions. Price IDs live in
// env (you paste them after creating the 2 Products × 2 intervals in Stripe):
//
//   STRIPE_PRICE_STANDARD_MONTHLY / STRIPE_PRICE_STANDARD_YEARLY
//   STRIPE_PRICE_PRO_MONTHLY      / STRIPE_PRICE_PRO_YEARLY
//
// forward: (tier, interval) → priceId — used to build a Checkout Session.
// reverse: priceId → { tier, interval } — used by the webhook to resolve the
// tier a customer just subscribed to. Only paid tiers have prices (Free is the
// absence of a subscription).

export type BillingInterval = "month" | "year";

type PaidTier = Exclude<PlanTier, "free">;

const PRICE_ENV: Record<PaidTier, Record<BillingInterval, string | undefined>> = {
  standard: {
    month: process.env.STRIPE_PRICE_STANDARD_MONTHLY,
    year: process.env.STRIPE_PRICE_STANDARD_YEARLY,
  },
  pro: {
    month: process.env.STRIPE_PRICE_PRO_MONTHLY,
    year: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
};

/** The Stripe Price ID for a paid tier + interval, or null if not configured. */
export function priceIdFor(tier: PaidTier, interval: BillingInterval): string | null {
  return PRICE_ENV[tier]?.[interval] ?? null;
}

/** Resolve a Stripe Price ID back to our tier + interval (for the webhook). */
export function tierForPriceId(
  priceId: string | null | undefined,
): { tier: PaidTier; interval: BillingInterval } | null {
  if (!priceId) return null;
  for (const tier of Object.keys(PRICE_ENV) as PaidTier[]) {
    for (const interval of ["month", "year"] as BillingInterval[]) {
      if (PRICE_ENV[tier][interval] === priceId) return { tier, interval };
    }
  }
  return null;
}

/** Normalize an arbitrary string to a BillingInterval (defaults to month). */
export function toInterval(v: unknown): BillingInterval {
  return v === "year" || v === "yearly" || v === "annual" ? "year" : "month";
}
