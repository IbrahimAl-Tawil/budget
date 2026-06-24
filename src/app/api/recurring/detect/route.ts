import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { detectRecurringExpenses } from "@/lib/ai/detect-recurring";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get last 6 months of transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: sixMonthsAgo },
        amount: { lt: 0 }, // Only expenses
      },
      orderBy: { date: "asc" },
      select: { id: true, name: true, amount: true, date: true },
    });

    const suggestions = await detectRecurringExpenses(
      transactions.map((t) => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date.toISOString().split("T")[0],
      }))
    );

    return Response.json({ suggestions });
  } catch (error) {
    console.error("Recurring detection error:", error);
    return Response.json({ error: "Detection failed" }, { status: 500 });
  }
}
