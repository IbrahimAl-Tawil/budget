"use client";

import { useRouter } from "next/navigation";
import { OtterfundAccounts } from "@/components/otterfund/pages/accounts";
import { useOtterfundChrome } from "@/components/otterfund/chrome-context";
import type { AccountView, NetWorthPoint } from "@/lib/types";

export function AccountsView({
  accounts,
  netWorth,
  currency,
  netWorthTrend,
  netWorthChange,
}: {
  accounts: AccountView[];
  netWorth: number;
  currency: string;
  netWorthTrend: NetWorthPoint[];
  netWorthChange: number;
}) {
  const router = useRouter();
  const { accent, theme, addAccount, connectBank, editAccount, refreshData } = useOtterfundChrome();
  return (
    <OtterfundAccounts
      accounts={accounts}
      netWorth={netWorth}
      currency={currency}
      netWorthTrend={netWorthTrend}
      netWorthChange={netWorthChange}
      accent={accent}
      theme={theme}
      onAdd={addAccount}
      onConnect={connectBank}
      onEdit={editAccount}
      onSynced={refreshData}
      onViewInvestments={() => router.push("/dashboard/investments")}
    />
  );
}
