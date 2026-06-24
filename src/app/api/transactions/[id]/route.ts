import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/transactions/[id]">
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Verify ownership
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, amount, category, type, date } = body;

    let categoryId = existing.categoryId;
    if (category !== undefined) {
      const cat = await prisma.category.findUnique({
        where: { userId_name: { userId: user.id, name: category } },
      });
      categoryId = cat?.id || null;
    }

    let finalAmount = existing.amount;
    if (amount !== undefined) {
      finalAmount =
        type === "credit" || (type === undefined && existing.amount > 0)
          ? Math.abs(amount)
          : -Math.abs(amount);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(amount !== undefined && { amount: finalAmount }),
        ...(categoryId !== undefined && { categoryId }),
        ...(date !== undefined && { date: new Date(date) }),
      },
      include: { category: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Update transaction error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/transactions/[id]">
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return Response.json({ success: true });
}
