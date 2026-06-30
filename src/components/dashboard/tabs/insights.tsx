"use client";

import { useState } from "react";
import type { InsightView } from "@/lib/types";
import { GlassCard, CardLabel } from "@/components/dashboard/primitives/glass-card";
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
    <div className="tab-content flex flex-col gap-10 sm:gap-14 w-full max-w-[1080px] mx-auto">
      {/* ── HERO · AI Overview ───────────────────────────────────────── */}
      <GlassCard className="p-8 sm:p-12 hover:translate-y-0">
        <div className="flex justify-between items-start gap-6 flex-wrap">
          <div>
            <div className="text-[11px] font-medium tracking-[0.07em] uppercase text-sage mb-4">
              AI Overview
            </div>
            <div className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] tracking-[-0.025em] leading-[1.12] text-bulga-text max-w-[640px]">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {insights.map((ins) => (
            <GlassCard key={ins.id} className="hover:translate-y-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{ background: ins.tagColor }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: ins.tagColor }}
                >
                  {ins.tag}
                </span>
              </div>
              <p className="text-[14px] sm:text-[15px] leading-[1.6] text-muted-text mt-3">
                {ins.body}
              </p>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-8 hover:translate-y-0">
          <CardLabel>No insights yet</CardLabel>
          <p className="text-sm text-muted-text mt-2">
            Click &quot;Generate Insights&quot; above to get AI-powered analysis of your finances.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
