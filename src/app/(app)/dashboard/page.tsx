import { requireUser, currentPeriod, resolvePeriod, dashboardOverview } from "@/lib/dashboard-context";
import { isCurrentPeriod } from "@/lib/period";
import { OverviewView } from "@/components/otterfund/pages/overview-view";

const EMPTY_OVERVIEW = {
  netWorth: 0, netWorthChange: 0, cash: 0, monthlyIncome: 0, monthlySpend: 0, monthlySurplus: 0,
  budgetTarget: 0, savingsRate: 0, savedAmount: 0, currency: "CAD",
  spendingByCategory: [], upcomingBills: [],
  incomeVsExpense: { months: [], income: [], expenses: [] },
  netWorthTrend: [], goals: [], recentTransactions: [],
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const user = await requireUser();
  const today = currentPeriod();
  const { month, year } = resolvePeriod(await searchParams, today);
  const overview = await dashboardOverview(user.id, month, year).catch(() => null);
  return (
    <OverviewView
      overview={overview ?? EMPTY_OVERVIEW}
      name={user.name ?? null}
      period={{ month, year }}
      isCurrentMonth={isCurrentPeriod({ month, year }, today)}
    />
  );
}
