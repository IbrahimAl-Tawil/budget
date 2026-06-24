import { anthropic } from "./client";
import { prisma } from "@/lib/db/prisma";

export async function generateInsightsForUser(userId: string) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [user, transactions, subscriptions, goals, accounts] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: threeMonthsAgo } },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      prisma.subscription.findMany({ where: { userId, isActive: true } }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.account.findMany({ where: { userId } }),
    ]);

  if (!user || transactions.length === 0) return [];

  // Build summary for Claude
  const netWorth = accounts.reduce((s, a) => s + a.balance, 0);
  const totalSubscriptions = subscriptions.reduce((s, sub) => s + sub.amount, 0);

  const categorySpend = new Map<string, number>();
  const monthlyTotals = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const monthKey = `${tx.date.getFullYear()}-${tx.date.getMonth() + 1}`;
    const entry = monthlyTotals.get(monthKey) || { income: 0, expenses: 0 };

    if (tx.amount > 0) {
      entry.income += tx.amount;
    } else {
      entry.expenses += Math.abs(tx.amount);
      if (tx.category) {
        categorySpend.set(
          tx.category.name,
          (categorySpend.get(tx.category.name) || 0) + Math.abs(tx.amount)
        );
      }
    }
    monthlyTotals.set(monthKey, entry);
  }

  const summary = {
    monthlyIncome: user.monthlyIncome,
    budgetTarget: user.budgetTarget,
    netWorth,
    subscriptionsCost: totalSubscriptions,
    categorySpending: Object.fromEntries(categorySpend),
    monthlyTrend: Object.fromEntries(monthlyTotals),
    goals: goals.map((g) => ({
      name: g.name,
      saved: g.saved,
      target: g.target,
      pctComplete: Math.round((g.saved / g.target) * 100),
    })),
    subscriptions: subscriptions.map((s) => ({ name: s.name, amount: s.amount, cycle: s.cycle })),
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: `You are a personal finance advisor analyzing a user's financial data. Generate 4-6 actionable insights.

Each insight should be one of these types:
- "Spending Pattern": Notable spending trends or patterns
- "Alert": Warnings about overspending, unused subscriptions, or budget issues
- "Opportunity": Suggestions for saving more, reallocating funds, or reaching goals faster
- "Trend": Projections or trends in net worth, savings, or spending

Respond with ONLY a valid JSON array:
[{
  "tag": "Spending Pattern",
  "body": "Your insight text here. Use specific numbers from the data.",
  "tagColor": "oklch(60% 0.09 155)",
  "tagBg": "oklch(25% 0.06 155)"
}, ...]

Tag colors:
- Spending Pattern: tagColor "oklch(60% 0.09 155)", tagBg "oklch(25% 0.06 155)"
- Alert: tagColor "oklch(75% 0.1 38)", tagBg "oklch(22% 0.06 38)"
- Opportunity: tagColor "oklch(75% 0.07 245)", tagBg "oklch(22% 0.06 245)"
- Trend: tagColor "oklch(60% 0.09 155)", tagBg "oklch(25% 0.06 155)"

Be specific, actionable, and reference actual numbers. Keep each insight to 1-2 sentences.`,
    messages: [
      {
        role: "user",
        content: `Analyze this financial data and generate insights:\n${JSON.stringify(summary)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      tag: string;
      body: string;
      tagColor: string;
      tagBg: string;
    }[];

    // Store insights in DB
    const created = await Promise.all(
      parsed.map((insight) =>
        prisma.insight.create({
          data: {
            userId,
            tag: insight.tag,
            body: insight.body,
            tagColor: insight.tagColor,
            tagBg: insight.tagBg,
          },
        })
      )
    );

    return created.map((i) => ({
      id: i.id,
      tag: i.tag,
      body: i.body,
      tagColor: i.tagColor || "oklch(60% 0.09 155)",
      tagBg: i.tagBg || "oklch(25% 0.06 155)",
    }));
  } catch {
    return [];
  }
}
