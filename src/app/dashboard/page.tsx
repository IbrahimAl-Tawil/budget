import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardOverview, getSpendingData, getGoals, getTransactions, getSubscriptions, getAccounts, getInsights } from "@/lib/db/queries";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (!session.user.onboardingDone) redirect("/onboarding");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const userId = session.user.id;

  // Fetch all tab data server-side in parallel
  const [overview, spending, goals, transactions, subscriptions, accounts, insights] = await Promise.all([
    getDashboardOverview(userId, month, year).catch(() => null),
    getSpendingData(userId, month, year).catch(() => []),
    getGoals(userId).catch(() => []),
    getTransactions(userId, { month, year }).catch(() => ({ transactions: [], total: 0, totalPages: 0 })),
    getSubscriptions(userId).catch(() => []),
    getAccounts(userId).catch(() => []),
    getInsights(userId).catch(() => []),
  ]);

  return (
    <DashboardShell
      initialData={{
        overview: overview || {
          netWorth: 0, netWorthChange: 0, monthlyIncome: 0, monthlySpend: 0,
          monthlySurplus: 0,
          budgetTarget: 0, savingsRate: 0, savedAmount: 0, currency: session.user.name ? "CAD" : "CAD",
          spendingByCategory: [], upcomingBills: [],
          incomeVsExpense: { months: [], income: [], expenses: [] },
          netWorthTrend: [], goals: [], recentTransactions: [],
        },
        spending: spending as never,
        goals: goals as never,
        transactions: transactions as never,
        subscriptions: subscriptions as never,
        accounts: accounts as never,
        insights: insights as never,
        month,
        year,
      }}
    />
  );
}
