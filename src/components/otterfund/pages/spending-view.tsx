"use client";

import { OtterfundSpending } from "@/components/otterfund/pages/spending";
import { useOtterfundChrome } from "@/components/otterfund/chrome-context";
import type { SpendingPlanView, SubscriptionView } from "@/lib/types";

export function SpendingView({
  plan,
  subscriptions,
  currency,
}: {
  plan: SpendingPlanView;
  subscriptions: SubscriptionView[];
  currency: string;
}) {
  const { accent, theme, hrefFor, addSubscription, editSubscription, hasAccounts, addAccount, connectBank } = useOtterfundChrome();
  return (
    <OtterfundSpending
      plan={plan}
      accent={accent}
      theme={theme}
      subscriptions={subscriptions}
      currency={currency}
      hasAccounts={hasAccounts}
      onAddAccount={addAccount}
      onConnect={connectBank}
      onAddSubscription={addSubscription}
      onEditSubscription={editSubscription}
      goalsHref={hrefFor("/dashboard/goals")}
    />
  );
}
