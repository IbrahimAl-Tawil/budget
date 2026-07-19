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
}: {
  plan: SpendingPlanView;
  subscriptions: SubscriptionView[];
  /** Auto-detected subscriptions awaiting review (accept / decline). */
  suggestions?: SubscriptionView[];
  currency: string;
  /** The month being viewed — the category drill-in queries the same window. */
  period: { month: number; year: number };
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
