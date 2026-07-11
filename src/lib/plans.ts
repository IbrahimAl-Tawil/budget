// otterfund — plans & entitlements.
//
// ONE source of truth for what each paid tier unlocks, shared by the server
// (GraphQL resolvers + the Stripe webhook) and the client (paywall modal,
// locked-feature panels, plan labels). Client-safe: NO server-only imports —
// this file is pulled into client components. Stripe Price IDs are NOT here;
// they live in env and are mapped in lib/stripe/config.ts (server-only).

export const PLAN_TIERS = ["free", "standard", "pro"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/** Gated capabilities. A resolver/UI asks `canUse(plan, feature)`. */
export type Feature = "bank_sync" | "insights" | "advisor" | "investments";

export interface PlanEntitlements {
  /** Max connected bank (Plaid) accounts. 0 = bank sync entirely locked. */
  bankAccounts: number;
  /** AI advisor chat. */
  advisor: boolean;
  /** AI insights generation. */
  insights: boolean;
  /** Investments tab. */
  investments: boolean;
  /** Durable per-user daily advisor-message cap. 0 when advisor is locked,
      `null` when unlimited (Pro). Per-minute/hour rate limits still apply as
      abuse protection regardless. */
  aiDailyMessages: number | null;
}

// Entitlement matrix — mirrors the /pricing table. Insights + advisor unlock at
// Standard; investments are Pro-only.
export const PLAN_ENTITLEMENTS: Record<PlanTier, PlanEntitlements> = {
  free: {
    bankAccounts: 0,
    advisor: false,
    insights: false,
    investments: false,
    aiDailyMessages: 0,
  },
  standard: {
    bankAccounts: 3,
    advisor: true,
    insights: true,
    investments: false,
    aiDailyMessages: 50,
  },
  pro: {
    bankAccounts: 10,
    advisor: true,
    insights: true,
    investments: true,
    aiDailyMessages: null, // "Unlimited AI chats & insights" — no daily cap
  },
};

/** Display metadata for the paywall modal + plan labels (kept in sync with the
    pricing page). */
export const PLAN_META: Record<PlanTier, { name: string; label: string }> = {
  free: { name: "Free", label: "Free plan" },
  standard: { name: "Standard", label: "Standard plan" },
  pro: { name: "Pro", label: "Pro plan" },
};

/** The lowest tier that grants a feature — what a paywall should point users to. */
export const FEATURE_REQUIRED_TIER: Record<Feature, PlanTier> = {
  bank_sync: "standard",
  insights: "standard",
  advisor: "standard",
  investments: "pro",
};

/** Short marketing copy for each gated feature, shown in the paywall modal. */
export const FEATURE_COPY: Record<
  Feature,
  { title: string; blurb: string; perks: string[] }
> = {
  bank_sync: {
    title: "Connect your bank",
    blurb: "Sync transactions and balances automatically — no more manual entry.",
    perks: [
      "Connect up to 3 bank accounts",
      "Automatic transaction categorization",
      "Always-current balances",
    ],
  },
  insights: {
    title: "AI insights",
    blurb: "Let otterfund surface where your money's going and how to save more.",
    perks: ["Access AI chats & insights", "Savings opportunities", "Refreshed daily"],
  },
  advisor: {
    title: "AI financial advisor",
    blurb: "Ask questions about your finances and get answers grounded in your data.",
    perks: ["Access AI chats & insights", "Grounded in your accounts", "Saved conversations"],
  },
  investments: {
    title: "Investments",
    blurb: "Track your holdings and see your full net worth in one place.",
    perks: ["Real-time investment tracking", "Full net worth in one place", "Priority support"],
  },
};

export function isPlanTier(v: unknown): v is PlanTier {
  return typeof v === "string" && (PLAN_TIERS as readonly string[]).includes(v);
}

/** Normalize any stored/incoming value to a valid tier (defaults to free). */
export function toPlanTier(v: unknown): PlanTier {
  return isPlanTier(v) ? v : "free";
}

export function entitlementsFor(plan: PlanTier | string | null | undefined): PlanEntitlements {
  return PLAN_ENTITLEMENTS[toPlanTier(plan)];
}

/** 0 = free, 1 = standard, 2 = pro. For "is at least" comparisons. */
export function tierRank(plan: PlanTier | string | null | undefined): number {
  return PLAN_TIERS.indexOf(toPlanTier(plan));
}

/** Whether a plan grants a boolean feature (bank_sync = has >0 account allowance). */
export function canUse(plan: PlanTier | string | null | undefined, feature: Feature): boolean {
  const e = entitlementsFor(plan);
  switch (feature) {
    case "bank_sync":
      return e.bankAccounts > 0;
    case "insights":
      return e.insights;
    case "advisor":
      return e.advisor;
    case "investments":
      return e.investments;
  }
}
