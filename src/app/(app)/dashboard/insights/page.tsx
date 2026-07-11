import { requireUser } from "@/lib/dashboard-context";
import { getInsights } from "@/lib/db/queries";
import { InsightsView } from "@/components/otterfund/pages/insights-view";
import { LockedFeature } from "@/components/otterfund/locked-feature";
import { canUse } from "@/lib/plans";

export default async function InsightsPage() {
  const user = await requireUser();
  // Insights + the AI advisor are a Standard+ feature — show the upsell instead
  // of the workspace when the plan doesn't include it (resolvers hard-gate too).
  if (!canUse(user.plan, "insights")) return <LockedFeature feature="insights" />;
  const insights = await getInsights(user.id).catch(() => []);
  return <InsightsView insights={insights} currency={user.currency ?? "CAD"} />;
}
