import type Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { stripe } from "@/lib/stripe/client";
import { tierForPriceId } from "@/lib/stripe/config";
import { rateLimit, tooManyRequests, MINUTE } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 256 * 1024;

// Stripe billing webhook. The SOURCE OF TRUTH for a user's plan: Checkout only
// starts the flow; the plan is written here when Stripe confirms the change.
// Idempotent via the StripeEvent table (Stripe delivers at-least-once).

async function readBodyCapped(request: Request, maxBytes: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(request: Request) {
  const flood = rateLimit("stripe:webhook:global", [{ limit: 240, windowMs: MINUTE }]);
  if (!flood.ok) return tooManyRequests(flood.retryAfterSec);

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    // Not configured yet — acknowledge so Stripe's test pings don't error-spam.
    return Response.json({ received: true, configured: false });
  }

  const body = await readBodyCapped(request, MAX_WEBHOOK_BYTES);
  if (body === null) return Response.json({ error: "Payload too large" }, { status: 413 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    logSecurityEvent("webhook.signature_failed", { source: "stripe" });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: if we've already recorded this event id, ack without re-applying.
  const seen = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen) return Response.json({ received: true, duplicate: true });

  let targetUserId: string | null = null;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.metadata?.userId as string | undefined) ??
          (typeof session.client_reference_id === "string" ? session.client_reference_id : null);
        // Persist the customer id if it wasn't already linked.
        if (userId && typeof session.customer === "string") {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: session.customer },
          }).catch(() => {});
        }
        // Load the subscription and apply its full state.
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          targetUserId = await applySubscription(sub, userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        targetUserId = await applySubscription(sub, null);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook processing error:", err);
    // Record nothing on failure so Stripe retries and we re-apply.
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  // Record last so a mid-processing crash leaves the event un-acked for retry.
  await prisma.stripeEvent
    .create({
      data: {
        id: event.id,
        type: event.type,
        userId: targetUserId,
        payload: event as unknown as object,
      },
    })
    .catch(() => {}); // concurrent duplicate — already handled

  return Response.json({ received: true });
}

// Resolve the target user (by explicit id, subscription metadata, or the stored
// stripeCustomerId) and write the plan/status derived from the subscription.
// Returns the affected userId (or null if we couldn't map it).
async function applySubscription(
  sub: Stripe.Subscription,
  knownUserId: string | null,
): Promise<string | null> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Find the user: explicit → subscription metadata → customer id lookup.
  let userId =
    knownUserId ?? (sub.metadata?.userId as string | undefined) ?? null;
  if (!userId) {
    const u = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    userId = u?.id ?? null;
  }
  if (!userId) return null;

  // The price on the first line item → our tier + interval.
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id;
  const mapped = tierForPriceId(priceId);

  // A canceled/deleted or otherwise inactive subscription drops the user to free.
  const activeStatuses = new Set(["active", "trialing", "past_due"]);
  const terminated = sub.status === "canceled" || isEnded(sub);
  const isActive = activeStatuses.has(sub.status);

  const plan = terminated || !isActive || !mapped ? "free" : mapped.tier;
  const interval = mapped?.interval === "year" ? "year" : mapped?.interval === "month" ? "month" : null;

  // current_period_end lives at the item level in newer API versions; fall back.
  const periodEnd =
    (item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end) ?? null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      planStatus: sub.status,
      planInterval: plan === "free" ? null : interval,
      planRenewsAt: plan === "free" || !periodEnd ? null : new Date(periodEnd * 1000),
      stripeSubscriptionId: plan === "free" ? null : sub.id,
      stripeCustomerId: customerId,
    },
  });
  return userId;
}

// Extra safety alongside a "canceled" status: a subscription that has an
// ended_at timestamp is terminal regardless of the status string.
function isEnded(sub: Stripe.Subscription): boolean {
  return !!(sub as unknown as { ended_at?: number }).ended_at;
}
