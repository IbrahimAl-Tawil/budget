import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, emoji, target, saved, deadline, priority } = await request.json();

    if (!name || !target) {
      return Response.json({ error: "Name and target are required" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        name,
        emoji: emoji || undefined,
        target: Number(target),
        saved: Number(saved) || 0,
        priority: priority !== undefined ? Number(priority) : 0,
        deadline: deadline ? new Date(deadline) : undefined,
        color: `oklch(${55 + Math.random() * 10}% 0.09 ${Math.round(Math.random() * 360)})`,
      },
    });

    return Response.json(goal, { status: 201 });
  } catch (error) {
    console.error("Create goal error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
