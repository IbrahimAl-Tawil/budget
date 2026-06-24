import { prisma } from "./prisma";
import { computeMonthlySurplus } from "./calculations";

export interface GoalAllocationPlan {
  goalId: string;
  amount: number;
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

  const eligible = goals.filter((g) => g.target - g.saved > 0);
  if (eligible.length === 0) return [];

  // Each goal carries: priority weight, remaining capacity (target - saved),
  // and a running allocation that we adjust as we cap and redistribute.
  type Slot = { goalId: string; weight: number; cap: number; amount: number };
  const slots: Slot[] = eligible.map((g) => ({
    goalId: g.id,
    weight: g.priority,
    cap: g.target - g.saved,
    amount: 0,
  }));

  let remaining = summary.surplus;

  // Iteratively allocate by weight, then cap. Any excess from capped goals is
  // redistributed across the still-uncapped goals on the next pass.
  while (remaining > 0.0001) {
    const open = slots.filter((s) => s.cap - s.amount > 0.0001);
    if (open.length === 0) break;

    const totalWeight = open.reduce((s, x) => s + x.weight, 0);
    const useEvenSplit = totalWeight <= 0;

    let distributedThisPass = 0;
    for (const slot of open) {
      const share = useEvenSplit
        ? remaining / open.length
        : (remaining * slot.weight) / totalWeight;
      const room = slot.cap - slot.amount;
      const take = Math.min(share, room);
      slot.amount += take;
      distributedThisPass += take;
    }

    remaining -= distributedThisPass;
    // Stop if a pass distributed effectively nothing — avoids infinite loops
    // when only zero-weight slots remain alongside positive-weight slots that
    // are fully capped (uncommon but possible with fractional rounding).
    if (distributedThisPass < 0.0001) break;
  }

  return slots
    .filter((s) => s.amount > 0)
    .map((s) => ({
      goalId: s.goalId,
      amount: Math.round(s.amount * 100) / 100,
    }));
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
