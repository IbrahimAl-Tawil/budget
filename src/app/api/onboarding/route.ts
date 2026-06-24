import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_CATEGORIES, DEFAULT_BUDGET_SPLITS } from "@/lib/db/seed-categories";

export async function POST(request: Request) {
  try {
    const user = await getApiUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const {
      monthlyIncome,
      currency,
      budgetTarget,
      accounts,
      recurringExpenses,
    } = body as {
      monthlyIncome: number;
      currency: string;
      budgetTarget: number;
      accounts: { name: string; type: string; balance: number }[];
      recurringExpenses: { name: string; amount: number; cycle: string; dueDay?: number }[];
    };

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Run everything in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user profile
      await tx.user.update({
        where: { id: userId },
        data: {
          monthlyIncome,
          currency: currency || "CAD",
          budgetTarget,
          onboardingDone: true,
        },
      });

      // Create default categories
      const categoryRecords = await Promise.all(
        DEFAULT_CATEGORIES.map((cat) =>
          tx.category.create({
            data: {
              userId,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              isDefault: true,
            },
          })
        )
      );

      // Create budget entries for each expense category
      const categoryMap = new Map(categoryRecords.map((c) => [c.name, c.id]));
      const budgetEntries = Object.entries(DEFAULT_BUDGET_SPLITS)
        .filter(([name]) => categoryMap.has(name))
        .map(([name, pct]) => ({
          userId,
          categoryId: categoryMap.get(name)!,
          amount: Math.round(budgetTarget * pct),
          month: currentMonth,
          year: currentYear,
        }));

      if (budgetEntries.length > 0) {
        await Promise.all(
          budgetEntries.map((entry) => tx.budget.create({ data: entry }))
        );
      }

      // Create accounts
      if (accounts?.length) {
        await Promise.all(
          accounts.map((acc) =>
            tx.account.create({
              data: {
                userId,
                name: acc.name,
                type: acc.type,
                balance: acc.balance,
              },
            })
          )
        );
      }

      // Create subscriptions and bills from recurring expenses
      if (recurringExpenses?.length) {
        await Promise.all(
          recurringExpenses.map((expense) =>
            tx.subscription.create({
              data: {
                userId,
                name: expense.name,
                amount: expense.amount,
                cycle: expense.cycle || "Monthly",
                confirmedByUser: true,
              },
            })
          )
        );

        // Also create upcoming bills for monthly recurring expenses
        await Promise.all(
          recurringExpenses
            .filter((e) => e.cycle === "Monthly" || !e.cycle)
            .map((expense) => {
              // Use the actual due day if provided, otherwise default to the 1st
              const day = expense.dueDay || 1;
              // Find next occurrence: if the day already passed this month, use next month
              let dueDate = new Date(currentYear, currentMonth - 1, day);
              if (dueDate <= now) {
                dueDate = new Date(currentYear, currentMonth, day);
              }
              return tx.bill.create({
                data: {
                  userId,
                  name: expense.name,
                  amount: expense.amount,
                  dueDate,
                },
              });
            })
        );
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
