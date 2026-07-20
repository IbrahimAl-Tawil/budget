import { prisma } from "./prisma";
import { computeMonthlySurplus, computeGoalCashHeadroom } from "./calculations";
import { allocatePool } from "@/lib/goal-split";

// Re-exported so existing server callers keep importing the allocator from here;
// the implementation lives in the client-safe `@/lib/goal-split`.
export { allocatePool } from "@/lib/goal-split";
export type { AllocatableGoal } from "@/lib/goal-split";

export interface GoalAllocationPlan {
  goalId: string;
  amount: number;
}

/**
 * Assigns this month's *remaining* real surplus across under-funded goals and
 * records it, so the same cash can't be assigned twice. Available = surplus −
 * what's already been assigned this month (sum of applied GoalAllocation rows).
 * Each funded goal's `saved` is incremented and its month's applied allocation
 * is bumped by the same amount, all in one transaction. Server-authoritative:
 * the amount is derived here, never taken from the client.
 *
 * @param userId - Owner of the goals.
 * @param month - 1-indexed month.
 * @param year - 4-digit year.
 * @returns The total assigned and how many goals were funded (0 when there's
 *          nothing left to assign or no under-funded goals).
 */
export async function assignAvailableSurplus(
  userId: string,
  month: number,
  year: number
): Promise<{ assigned: number; goalsFunded: number }> {
  const [summary, goals, assignedAgg, cashHeadroom] = await Promise.all([
    computeMonthlySurplus(userId, month, year),
    prisma.goal.findMany({ where: { userId } }),
    prisma.goalAllocation.aggregate({
      where: { userId, month, year, status: "applied" },
      _sum: { amount: true },
    }),
    computeGoalCashHeadroom(userId),
  ]);

  const surplus = Math.max(0, summary.surplus);
  const already = assignedAgg._sum.amount ?? 0;
  // Bounded by both this month's remaining surplus and the cash actually on hand
  // — you can't set aside money you don't physically have.
  const surplusFree = Math.max(0, Math.round((surplus - already) * 100) / 100);
  const available = Math.min(surplusFree, cashHeadroom);
  if (available <= 0) return { assigned: 0, goalsFunded: 0 };

  const split = allocatePool(goals, available);
  if (split.size === 0) return { assigned: 0, goalsFunded: 0 };

  let assigned = 0;
  await prisma.$transaction(async (tx) => {
    for (const [goalId, amt] of split.entries()) {
      assigned += amt;
      await tx.goal.update({ where: { id: goalId }, data: { saved: { increment: amt } } });
      await tx.goalAllocation.upsert({
        where: { userId_goalId_month_year: { userId, goalId, month, year } },
        create: { userId, goalId, month, year, amount: amt, status: "applied" },
        update: { amount: { increment: amt }, status: "applied" },
      });
    }
  });

  return { assigned: Math.round(assigned * 100) / 100, goalsFunded: split.size };
}

/**
 * Assigns a *specific* amount to a *single* goal — the manual counterpart to
 * `assignAvailableSurplus`. Deliberately NOT capped by the month's surplus or
 * cash on hand: the user is the authority on their own money (some of it may sit
 * in accounts otterfund can't see), so the UI warns when an amount runs past the
 * detected surplus but still lets it through. The only hard ceiling is the goal's
 * remaining need (target − saved) — you can't fund a goal past its target.
 * Contrast `assignAvailableSurplus`, the automatic split, which stays capped so
 * the app never allocates money on its own that isn't there.
 *
 * Increments the goal's `saved` and bumps its month's applied allocation by the
 * same amount in one transaction. Server-authoritative: the ceiling is derived
 * here (the client's amount is trusted only up to the goal's remaining need).
 *
 * @param userId - Owner of the goal.
 * @param goalId - The goal to fund (must belong to `userId`).
 * @param requested - The amount the client asked to assign.
 * @param month - 1-indexed month (for the allocation record).
 * @param year - 4-digit year (for the allocation record).
 * @returns The amount actually assigned (0 when the goal is already funded or
 *          doesn't belong to the user).
 */
export async function assignSurplusToGoal(
  userId: string,
  goalId: string,
  requested: number,
  month: number,
  year: number
): Promise<{ assigned: number }> {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return { assigned: 0 };

  // Bounded only by what the goal still needs — surplus/cash are a guide the UI
  // warns against, not a wall.
  const remaining = Math.max(0, Math.round((goal.target - goal.saved) * 100) / 100);
  const amt = Math.round(Math.max(0, Math.min(requested, remaining)) * 100) / 100;
  if (amt <= 0) return { assigned: 0 };

  await prisma.$transaction(async (tx) => {
    await tx.goal.update({ where: { id: goalId }, data: { saved: { increment: amt } } });
    await tx.goalAllocation.upsert({
      where: { userId_goalId_month_year: { userId, goalId, month, year } },
      create: { userId, goalId, month, year, amount: amt, status: "applied" },
      update: { amount: { increment: amt }, status: "applied" },
    });
  });

  return { assigned: amt };
}

/**
 * Computes how the current month's surplus should be split across active
 * (under-funded) goals. Splits proportionally by priority weight; when all
 * priorities are zero, splits evenly. Caps each goal at `target - saved`
 * and redistributes any leftover amount to remaining uncapped goals.
 *
 * @param userId - Owner of the goals.
 * @param month - 1-indexed month for the surplus computation.
 * @param year - 4-digit year for the surplus computation.
 * @returns Array of `{ goalId, amount }` allocations. Empty when surplus <= 0
 *          or there are no under-funded goals.
 */
export async function computeGoalAllocations(
  userId: string,
  month: number,
  year: number
): Promise<GoalAllocationPlan[]> {
  const [summary, goals] = await Promise.all([
    computeMonthlySurplus(userId, month, year),
    prisma.goal.findMany({ where: { userId } }),
  ]);

  if (summary.surplus <= 0) return [];

  const alloc = allocatePool(goals, summary.surplus);
  return [...alloc.entries()].map(([goalId, amount]) => ({ goalId, amount }));
}

/**
 * Inserts or updates `pending` GoalAllocation rows for a month/year using the
 * unique `(userId, goalId, month, year)` constraint. Existing applied or
 * overridden rows are reset to pending with the new amount.
 *
 * @param userId - Owner of the allocations.
 * @param month - 1-indexed month.
 * @param year - 4-digit year.
 * @param allocations - Computed allocation plans to persist.
 */
export async function upsertGoalAllocations(
  userId: string,
  month: number,
  year: number,
  allocations: GoalAllocationPlan[]
): Promise<void> {
  await Promise.all(
    allocations.map((a) =>
      prisma.goalAllocation.upsert({
        where: {
          userId_goalId_month_year: {
            userId,
            goalId: a.goalId,
            month,
            year,
          },
        },
        create: {
          userId,
          goalId: a.goalId,
          month,
          year,
          amount: a.amount,
          status: "pending",
        },
        update: {
          amount: a.amount,
          status: "pending",
        },
      })
    )
  );
}

/**
 * Applies all pending or overridden allocations for the given month/year:
 * adds each allocation amount to the linked goal's `saved` and marks the
 * allocation as `applied`. Runs in a single transaction.
 *
 * @param userId - Owner of the allocations.
 * @param month - 1-indexed month.
 * @param year - 4-digit year.
 * @returns Number of allocations applied.
 */
export async function applyGoalAllocations(
  userId: string,
  month: number,
  year: number
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const pending = await tx.goalAllocation.findMany({
      where: {
        userId,
        month,
        year,
        status: { in: ["pending", "overridden"] },
      },
    });

    for (const a of pending) {
      await tx.goal.update({
        where: { id: a.goalId },
        data: { saved: { increment: a.amount } },
      });
      await tx.goalAllocation.update({
        where: { id: a.id },
        data: { status: "applied" },
      });
    }

    return pending.length;
  });
}
