import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/accounts/[id]">
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.account.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { name, type, balance, number, gradient } = await request.json();

    const updated = await prisma.account.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(balance !== undefined && { balance: Number(balance) }),
        ...(number !== undefined && { number: number || null }),
        ...(gradient !== undefined && { gradient: gradient || null }),
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Update account error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/accounts/[id]">
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.account.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.account.delete({ where: { id } });
  return Response.json({ success: true });
}
