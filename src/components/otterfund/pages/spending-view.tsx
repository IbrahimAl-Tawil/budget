"use client";

import { OtterfundSpending } from "@/components/otterfund/pages/spending";
import { useOtterfundChrome } from "@/components/otterfund/chrome-context";
import type { SpendingPlanView, SubscriptionView } from "@/lib/types";

export function SpendingView({
  plan,
  subscriptions,
  suggestions = [],
  currency,
  period,
  isCurrentMonth,
}: {
  plan: SpendingPlanView;
  subscriptions: SubscriptionView[];
  /** Auto-detected subscriptions awaiting review (accept / decline). */
  suggestions?: SubscriptionView[];
  currency: string;
  /** The month being viewed — the category drill-in queries the same window. */
  period: { month: number; year: number };
  /** Whether `period` is the live month, so copy can say "this month" vs name it. */
  isCurrentMonth: boolean;
}) {
  const { accent, theme, hrefFor, addSubscription, editSubscription, editTransaction, hasAccounts, addAccount, connectBank, openSettings, refreshData } = useOtterfundChrome();
  return (
    <OtterfundSpending
      plan={plan}
      accent={accent}
      theme={theme}
      subscriptions={subscriptions}
      suggestions={suggestions}
      currency={currency}
      period={period}
      isCurrentMonth={isCurrentMonth}
      hasAccounts={hasAccounts}
      onAddAccount={addAccount}
      onConnect={connectBank}
      onAddSubscription={addSubscription}
      onEditSubscription={editSubscription}
      onEditTransaction={editTransaction}
      onReviewed={refreshData}
      onEditPlan={() => openSettings("money")}
      goalsHref={hrefFor("/dashboard/goals")}
    />
  );
}
