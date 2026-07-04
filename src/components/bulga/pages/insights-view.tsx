"use client";

import { BulgaInsights } from "@/components/bulga/pages/insights";
import { useBulgaChrome } from "@/components/bulga/chrome-context";
import type { InsightView } from "@/lib/types";

export function InsightsView({ insights, currency }: { insights: InsightView[]; currency: string }) {
  const { accent, theme } = useBulgaChrome();
  return <BulgaInsights insights={insights} accent={accent} theme={theme} currency={currency} />;
}
