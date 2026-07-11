import "server-only";
import Stripe from "stripe";

// Stripe SDK singleton. Server-only (never import into a client component).
// Mirrors the lazy-singleton pattern in src/lib/plaid/client.ts.
//
// The key is read lazily so the app boots without STRIPE_SECRET_KEY set —
// billing calls throw a friendly error (see stripeOrThrow) until the keys are
// added, but the rest of the app keeps working.

const globalForStripe = globalThis as unknown as { stripe?: Stripe | null };

function createStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, {
    // Pin to the version the installed SDK types target so behavior is stable.
    apiVersion: "2026-06-24.dahlia",
    appInfo: { name: "otterfund" },
  });
}

export const stripe: Stripe | null =
  globalForStripe.stripe !== undefined ? globalForStripe.stripe : createStripeClient();

if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;

/** Whether Stripe is configured (secret key present). */
export function stripeConfigured(): boolean {
  return !!stripe;
}

/** Get the Stripe client or throw a user-safe error when keys aren't set yet. */
export function stripeOrThrow(): Stripe {
  if (!stripe) {
    throw new Error("Billing isn't configured yet. Please try again later.");
  }
  return stripe;
}
