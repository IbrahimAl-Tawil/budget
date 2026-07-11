import { prisma } from "@/lib/db/prisma";
import { requireUser, upgradeRequired } from "./errors";
import type { GraphQLContext } from "./context";
import {
  canUse,
  entitlementsFor,
  FEATURE_REQUIRED_TIER,
  FEATURE_COPY,
  toPlanTier,
  type Feature,
  type PlanEntitlements,
  type PlanTier,
} from "@/lib/plans";

// Server-side entitlement gate for resolvers. This is the HARD paywall — the
// client also hides/locks gated UI, but every gated mutation asserts here so a
// crafted GraphQL call can't bypass a plan. One cheap DB read per gated call.

/** The signed-in user's current plan tier (defaults to free). */
export async function planForUser(userId: string): Promise<PlanTier> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return toPlanTier(row?.plan);
}

/**
 * Assert the signed-in user's plan includes `feature`; returns their userId.
 * Throws UNAUTHENTICATED if signed out, UPGRADE_REQUIRED (402) otherwise.
 */
export async function requireEntitlement(
  ctx: GraphQLContext,
  feature: Feature,
): Promise<string> {
  const userId = requireUser(ctx);
  const plan = await planForUser(userId);
  if (!canUse(plan, feature)) {
    const copy = FEATURE_COPY[feature];
    upgradeRequired(
      feature,
      FEATURE_REQUIRED_TIER[feature],
      `${copy.title} is not included in your plan. Upgrade to unlock it.`,
    );
  }
  return userId;
}

/**
 * Like requireEntitlement, but also returns the resolved plan + entitlements so
 * a resolver can enforce numeric caps (e.g. max bank accounts) without a second
 * read.
 */
export async function requireEntitlementDetail(
  ctx: GraphQLContext,
  feature: Feature,
): Promise<{ userId: string; plan: PlanTier; entitlements: PlanEntitlements }> {
  const userId = requireUser(ctx);
  const plan = await planForUser(userId);
  if (!canUse(plan, feature)) {
    const copy = FEATURE_COPY[feature];
    upgradeRequired(
      feature,
      FEATURE_REQUIRED_TIER[feature],
      `${copy.title} is not included in your plan. Upgrade to unlock it.`,
    );
  }
  return { userId, plan, entitlements: entitlementsFor(plan) };
}
