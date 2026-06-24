"use client";

import { useState } from "react";
import type { InsightView } from "@/lib/types";
import { GlassCard, CardLabel } from "./glass-card";
import { Loader2, Sparkles } from "lucide-react";

export function Insights({ data }: { data: InsightView[] }) {
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState(data);

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/insights/generate", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        if (result.insights) setInsights(result.insights);
      }
    } catch {
      // ignore
    }
    setGenerating(false);
  };

  return (
    <div className="tab-content grid grid-cols-2 gap-3.5">
      {/* AI Overview banner */}
      <GlassCard className="col-span-2 hover:translate-y-0">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-sage mb-3">AI Overview</div>
            <div className="font-serif text-[28px] text-bulga-text tracking-[-0.02em] leading-[1.15] max-w-[700px]">
              {insights.length > 0
                ? "Here are your latest financial insights powered by AI."
                : "Generate AI-powered insights about your spending patterns, savings opportunities, and financial trends."}
            </div>
          </div>
          <button
            onClick={generateInsights}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-sage text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? "Generating..." : "Generate Insights"}
          </button>
        </div>
      </GlassCard>

      {insights.length > 0 ? (
        insights.map((ins) => (
          <GlassCard key={ins.id} className="hover:translate-y-0">
            <span
              className="text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full inline-block mb-2.5 bg-[oklch(100%_0_0/0.1)] text-bulga-text"
            >
              {ins.tag}
            </span>
            <p className="text-sm leading-relaxed text-muted-text">
              {ins.body}
            </p>
          </GlassCard>
        ))
      ) : (
        <div className="col-span-2">
          <GlassCard className="text-center py-8">
            <CardLabel>No insights yet</CardLabel>
            <p className="text-sm text-muted-text mt-2">
              Click &quot;Generate Insights&quot; above to get AI-powered analysis of your finances.
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
