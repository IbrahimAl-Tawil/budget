import { builder } from "../builder";
import { requireUser, notFound, badRequest } from "../errors";
import {
  GoalAllocationRef,
  GoalAllocationsResultRef,
  MutationResultRef,
} from "../types/results";
import { computeMonthlySurplus } from "@/lib/db/calculations";
import {
  computeGoalAllocations,
  upsertGoalAllocations,
  applyGoalAllocations,
} from "@/lib/db/goal-allocation";
import { prisma } from "@/lib/db/prisma";
import type { GoalAllocationView } from "@/lib/types";

async function buildAllocationViews(
  userId: string,
  month: number,
  year: number,
): Promise<GoalAllocationView[]> {
  const rows = await prisma.goalAllocation.findMany({
    where: { userId, month, year },
    include: { goal: true },
  });
  return rows.map((r) => ({
    id: r.id,
    goalId: r.goalId,
    goalName: r.goal.name,
    goalEmoji: r.goal.emoji ?? "",
    amount: r.amount,
    status: r.status as GoalAllocationView["status"],
  }));
}

builder.queryField("goalAllocations", (t) =>
  t.field({
    type: GoalAllocationsResultRef,
    args: {
      month: t.arg.int({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, { month, year }, ctx) => {
      const userId = requireUser(ctx);
      const [summary, allocations] = await Promise.all([
        computeMonthlySurplus(userId, month, year),
        buildAllocationViews(userId, month, year),
      ]);
      return { surplus: summary.surplus, allocations };
    },
  }),
);

builder.mutationField("computeGoalAllocations", (t) =>
  t.field({
    type: [GoalAllocationRef],
    args: {
      month: t.arg.int({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, { month, year }, ctx) => {
      const userId = requireUser(ctx);
      const plan = await computeGoalAllocations(userId, month, year);
      await upsertGoalAllocations(userId, month, year, plan);
      return buildAllocationViews(userId, month, year);
    },
  }),
);

builder.mutationField("overrideGoalAllocation", (t) =>
  t.field({
    type: MutationResultRef,
    args: {
      allocationId: t.arg.id({ required: true }),
      amount: t.arg.float({ required: true }),
    },
    resolve: async (_root, { allocationId, amount }, ctx) => {
      const userId = requireUser(ctx);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) {
        badRequest("Allocation amount is out of range.");
      }
      const existing = await prisma.goalAllocation.findFirst({
        where: { id: allocationId, userId },
      });
      if (!existing) notFound();
      await prisma.goalAllocation.update({
        where: { id: allocationId },
        data: { amount, status: "overridden" },
      });
      return { ok: true, id: allocationId };
    },
  }),
);

builder.mutationField("applyGoalAllocations", (t) =>
  t.field({
    type: "Int",
    args: {
      month: t.arg.int({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: (_root, { month, year }, ctx) =>
      applyGoalAllocations(requireUser(ctx), month, year),
  }),
);
