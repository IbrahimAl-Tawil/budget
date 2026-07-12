"use client";

import { useRouter } from "next/navigation";
import { OtterfundInvestments } from "@/components/otterfund/pages/investments";
import { useOtterfundChrome } from "@/components/otterfund/chrome-context";
import type { AccountView, InvestmentView } from "@/lib/types";

export function InvestmentsView({
  accounts,
  holdings,
  currency,
}: {
  accounts: AccountView[];
  holdings: InvestmentView[];
  currency: string;
}) {
  const router = useRouter();
  const { accent, theme, addInvestment, editInvestment, editAccount, connectBank } = useOtterfundChrome();
  return (
    <OtterfundInvestments
      accounts={accounts}
      holdings={holdings}
      currency={currency}
      accent={accent}
      theme={theme}
      onConnect={connectBank}
      onAddPosition={addInvestment}
      onEditPosition={editInvestment}
      onEditAccount={editAccount}
      onBack={() => router.push("/dashboard/accounts")}
    />
  );
}
