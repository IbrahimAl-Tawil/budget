import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { categorizeTransactions } from "@/lib/ai/categorize";
import type { RawTransaction } from "@/lib/ai/categorize";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { statementId, transactions, accountId } = body as {
      statementId: string;
      transactions: RawTransaction[];
      accountId?: string;
    };

    if (!transactions?.length) {
      return Response.json({ error: "No transactions to import" }, { status: 400 });
    }

    // Get user's categories for categorization
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
    });
    const categoryNames = categories.map((c) => c.name);

    // Categorize with Claude
    const categorized = await categorizeTransactions(transactions, categoryNames);

    // Build a category name -> id map
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    // Bulk create transactions. Account balance is computed live from these,
    // so no Account.balance mutation is needed here.
    const created = await Promise.all(
      categorized.map((tx) =>
        prisma.transaction.create({
          data: {
            userId: user.id,
            name: tx.name,
            amount: tx.amount,
            date: new Date(tx.date),
            categoryId: categoryMap.get(tx.category) || undefined,
            accountId: accountId || undefined,
            icon: tx.icon,
            color: tx.color,
            isRecurring: tx.isRecurring,
            recurringFlag: tx.isRecurring ? "suggested" : undefined,
            source: "csv",
            statementId: statementId || undefined,
          },
        })
      )
    );

    // Update statement
    if (statementId) {
      await prisma.bankStatement.update({
        where: { id: statementId },
        data: { status: "done", txCount: created.length },
      });
    }

    return Response.json({
      imported: created.length,
      categorized: categorized.map((t) => ({
        name: t.name,
        amount: t.amount,
        category: t.category,
        isRecurring: t.isRecurring,
      })),
    });
  } catch (error) {
    console.error("Import confirm error:", error);
    return Response.json({ error: "Failed to import transactions" }, { status: 500 });
  }
}
