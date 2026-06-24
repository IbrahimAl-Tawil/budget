import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, monthlyIncome, currency, budgetTarget } = body;

    await prisma.user.update({
      where: { id: token.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(monthlyIncome !== undefined && { monthlyIncome }),
        ...(currency !== undefined && { currency }),
        ...(budgetTarget !== undefined && { budgetTarget }),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.user.delete({ where: { id: token.id as string } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
