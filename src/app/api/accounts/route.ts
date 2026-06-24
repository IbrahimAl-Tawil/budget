import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, type, balance, number } = await request.json();

    if (!name || balance === undefined) {
      return Response.json({ error: "Name and balance are required" }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type: type || "other",
        balance: Number(balance),
        number: number || undefined,
      },
    });

    return Response.json(account, { status: 201 });
  } catch (error) {
    console.error("Create account error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
