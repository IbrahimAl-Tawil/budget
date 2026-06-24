import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/goals/[id]">
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.goal.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { name, emoji, target, saved, deadline, color, priority } = await request.json();

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(emoji !== undefined && { emoji: emoji || null }),
        ...(target !== undefined && { target: Number(target) }),
        ...(saved !== undefined && { saved: Number(saved) }),
        ...(color !== undefined && { color: color || null }),
        ...(priority !== undefined && { priority: Number(priority) }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Update goal error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/goals/[id]">
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.goal.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });
  return Response.json({ success: true });
}
