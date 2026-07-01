import { builder } from "../builder";
import type { GoalAllocationView } from "@/lib/types";

/**
 * Generic mutation result. The client re-fetches via router.refresh() after a
 * successful mutation, so it needs only success + the affected id — not the full
 * entity. Mutations that must return richer data (link tokens, parse results,
 * allocations) define their own return types instead.
 */
export const MutationResultRef = builder
  .objectRef<{ ok: boolean; id?: string | null }>("MutationResult")
  .implement({
    fields: (t) => ({
      ok: t.exposeBoolean("ok"),
      id: t.exposeID("id", { nullable: true }),
    }),
  });

export const CategoryRef = builder
  .objectRef<{
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    isDefault: boolean;
  }>("Category")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      icon: t.exposeString("icon", { nullable: true }),
      color: t.exposeString("color", { nullable: true }),
      isDefault: t.exposeBoolean("isDefault"),
    }),
  });

export const GoalAllocationRef = builder
  .objectRef<GoalAllocationView>("GoalAllocation")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      goalId: t.exposeID("goalId"),
      goalName: t.exposeString("goalName"),
      goalEmoji: t.exposeString("goalEmoji"),
      amount: t.exposeFloat("amount"),
      status: t.exposeString("status"),
    }),
  });

export const GoalAllocationsResultRef = builder
  .objectRef<{ surplus: number; allocations: GoalAllocationView[] }>(
    "GoalAllocationsResult",
  )
  .implement({
    fields: (t) => ({
      surplus: t.exposeFloat("surplus"),
      allocations: t.field({
        type: [GoalAllocationRef],
        resolve: (o) => o.allocations,
      }),
    }),
  });
