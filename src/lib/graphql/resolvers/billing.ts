import { builder } from "../builder";
import { requireUser, badRequest } from "../errors";
import { prisma } from "@/lib/db/prisma";
import { stripeOrThrow } from "@/lib/stripe/client";
import { priceIdFor, toInterval } from "@/lib/stripe/config";
import { absoluteUrl } from "@/lib/seo";
import { isPlanTier, type PlanTier } from "@/lib/plans";
import { rateLimit, MINUTE } from "@/lib/rate-limit";

// Billing surface: read the current plan, start a Checkout Session to upgrade,
// or open the Stripe Billing Portal to manage/cancel. The webhook (not these
// mutations) is the source of truth for the stored plan — Checkout only kicks
// off the flow.

const BillingRef = builder
  .objectRef<{
    plan: string;
    status: string | null;
    interval: string | null;
    renewsAt: string | null;
    hasStripeCustomer: boolean;
  }>("Billing")
  .implement({
    fields: (t) => ({
      plan: t.exposeString("plan"),
      status: t.exposeString("status", { nullable: true }),
      interval: t.exposeString("interval", { nullable: true }),
      renewsAt: t.exposeString("renewsAt", { nullable: true }),
      hasStripeCustomer: t.exposeBoolean("hasStripeCustomer"),
    }),
  });

builder.queryField("myBilling", (t) =>
  t.field({
    type: BillingRef,
    resolve: async (_root, _args, ctx) => {
      const userId = requireUser(ctx);
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          plan: true,
          planStatus: true,
          planInterval: true,
          planRenewsAt: true,
          stripeCustomerId: true,
        },
      });
      return {
        plan: u?.plan ?? "free",
        status: u?.planStatus ?? null,
        interval: u?.planInterval ?? null,
        renewsAt: u?.planRenewsAt ? u.planRenewsAt.toISOString() : null,
        hasStripeCustomer: !!u?.stripeCustomerId,
      };
    },
  }),
);

// Find-or-create the Stripe customer for a user, persisting the id on first use.
async function ensureStripeCustomer(userId: string): Promise<string> {
  const stripe = stripeOrThrow();
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });
  if (!u) badRequest("Account not found.");
  if (u.stripeCustomerId) return u.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: u.email ?? undefined,
    name: u.name ?? undefined,
    metadata: { userId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

builder.mutationField("createCheckoutSession", (t) =>
  t.field({
    type: "String",
    args: {
      tier: t.arg.string({ required: true }),
      interval: t.arg.string({ required: false }),
      // Where Stripe returns the user. "onboarding" keeps a mid-onboarding user
      // in the wizard; anything else (the default) is the standard pricing flow.
      // A fixed set of destinations, never a raw URL — no open-redirect surface.
      returnTo: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = requireUser(ctx);
      const limit = rateLimit(`billing:checkout:${userId}`, [
        { limit: 12, windowMs: 5 * MINUTE },
      ]);
      if (!limit.ok) badRequest("Please wait a moment and try again.");

      const tier = args.tier as PlanTier;
      if (!isPlanTier(tier) || tier === "free") {
        badRequest("Choose a paid plan to continue.");
      }
      const interval = toInterval(args.interval);
      const priceId = priceIdFor(tier, interval);
      if (!priceId) {
        badRequest("That plan isn't available right now. Please try again later.");
      }

      const stripe = stripeOrThrow();
      const customerId = await ensureStripeCustomer(userId);

      const onboarding = args.returnTo === "onboarding";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        // Lets the webhook resolve the user even before the customer id is saved.
        client_reference_id: userId,
        line_items: [{ price: priceId!, quantity: 1 }],
        allow_promotion_codes: true,
        subscription_data: { metadata: { userId, tier } },
        metadata: { userId, tier },
        // Mid-onboarding: return to the wizard (it reads `?checkout=` to resume
        // past the plan step). Otherwise the standard pricing → dashboard flow.
        success_url: absoluteUrl(
          onboarding ? "/onboarding?checkout=success" : "/dashboard?checkout=success",
        ),
        cancel_url: absoluteUrl(
          onboarding ? "/onboarding?checkout=cancel" : "/pricing?checkout=cancel",
        ),
      });

      if (!session.url) badRequest("Couldn't start checkout. Please try again.");
      return session.url!;
    },
  }),
);

builder.mutationField("createBillingPortalSession", (t) =>
  t.field({
    type: "String",
    resolve: async (_root, _args, ctx) => {
      const userId = requireUser(ctx);
      const limit = rateLimit(`billing:portal:${userId}`, [
        { limit: 12, windowMs: 5 * MINUTE },
      ]);
      if (!limit.ok) badRequest("Please wait a moment and try again.");

      const stripe = stripeOrThrow();
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });
      if (!u?.stripeCustomerId) {
        badRequest("No billing account yet — choose a plan first.");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: u!.stripeCustomerId!,
        return_url: absoluteUrl("/dashboard"),
      });
      return session.url;
    },
  }),
);
