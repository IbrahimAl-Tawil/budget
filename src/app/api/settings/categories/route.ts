import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return Response.json({ categories });
}

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, icon, color } = await request.json();

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      userId: user.id,
      name,
      icon: icon || "circle",
      color: color || "oklch(68% 0.04 80)",
    },
  });

  return Response.json(category, { status: 201 });
}
