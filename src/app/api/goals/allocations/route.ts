import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { computeMonthlySurplus } from "@/lib/db/calculations";
import {
  computeGoalAllocations,
  upsertGoalAllocations,
  applyGoalAllocations,
} from "@/lib/db/goal-allocation";
import type { GoalAllocationView } from "@/lib/types";

function parseMonthYear(url: URL): { month: number; year: number } {
  const now = new Date();
  const month = Number(url.searchParams.get("month") || now.getMonth() + 1);
  const year = Number(url.searchParams.get("year") || now.getFullYear());
  return { month, year };
}

async function buildAllocationViews(
  userId: string,
  month: number,
  year: number
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

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { month, year } = parseMonthYear(new URL(request.url));

  const [summary, allocations] = await Promise.all([
    computeMonthlySurplus(user.id, month, year),
    buildAllocationViews(user.id, month, year),
  ]);

  return Response.json({ surplus: summary.surplus, allocations });
}

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { month, year } = parseMonthYear(new URL(request.url));

  const plan = await computeGoalAllocations(user.id, month, year);
  await upsertGoalAllocations(user.id, month, year, plan);
  const allocations = await buildAllocationViews(user.id, month, year);

  return Response.json({ allocations });
}

export async function PATCH(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { allocationId, amount } = await request.json();
    if (!allocationId || amount === undefined) {
      return Response.json(
        { error: "allocationId and amount are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.goalAllocation.findFirst({
      where: { id: allocationId, userId: user.id },
    });
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.goalAllocation.update({
      where: { id: allocationId },
      data: { amount: Number(amount), status: "overridden" },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Override allocation error:", error);
    return Response.json({ error: "Failed to override" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { month, year } = parseMonthYear(new URL(request.url));

  try {
    const applied = await applyGoalAllocations(user.id, month, year);
    return Response.json({ applied });
  } catch (error) {
    console.error("Apply allocations error:", error);
    return Response.json({ error: "Failed to apply" }, { status: 500 });
  }
}
