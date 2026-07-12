import { requireUser, userCurrency, currentPeriod, dashboardOverview } from "@/lib/dashboard-context";
import { getAccounts } from "@/lib/db/queries";
import { AccountsView } from "@/components/otterfund/pages/accounts-view";

export default async function AccountsPage() {
  const user = await requireUser();
  const { month, year } = currentPeriod();
  const [accounts, currency, overview] = await Promise.all([
    getAccounts(user.id).catch(() => []),
    userCurrency(user.id),
    // The net-worth history + this-month change powers the hero sparkline —
    // the same figures the Overview computes (dashboardOverview is cached, so
    // this is shared with the dashboard when both are visited).
    dashboardOverview(user.id, month, year).catch(() => null),
  ]);
  // Same figure the overview computes: sum of non-excluded account balances
  // (getAccounts already applies the synced-vs-manual balance rule).
  const netWorth = accounts.reduce((sum, a) => sum + (a.excluded ? 0 : a.balance), 0);
  return (
    <AccountsView
      accounts={accounts}
      netWorth={netWorth}
      currency={currency}
      netWorthTrend={overview?.netWorthTrend ?? []}
      netWorthChange={overview?.netWorthChange ?? 0}
    />
  );
}
