import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { getSubscriptions } from "@/lib/db/queries";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptions = await getSubscriptions(user.id);
  return Response.json({ subscriptions });
}

export async function PATCH(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, categoryId, amount } = await request.json();
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (categoryId !== undefined) {
      data.categoryId = categoryId || null;
    }
    if (amount !== undefined) {
      const next = Number(amount);
      if (Number.isFinite(next) && next !== existing.amount) {
        // Stash the prior amount so the price-change detector can flag the diff.
        data.previousAmount = existing.amount;
        data.amount = next;
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json(existing);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data,
    });
    return Response.json(updated);
  } catch (error) {
    console.error("Update subscription error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}
