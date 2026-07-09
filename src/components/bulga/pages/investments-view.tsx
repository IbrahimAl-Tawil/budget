"use client";

import { BulgaInvestments } from "@/components/bulga/pages/investments";
import { useBulgaChrome } from "@/components/bulga/chrome-context";
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
  const { accent, theme, addInvestment, editInvestment, editAccount, connectBank } = useBulgaChrome();
  return (
    <BulgaInvestments
      accounts={accounts}
      holdings={holdings}
      currency={currency}
      accent={accent}
      theme={theme}
      onConnect={connectBank}
      onAddPosition={addInvestment}
      onEditPosition={editInvestment}
      onEditAccount={editAccount}
    />
  );
}
