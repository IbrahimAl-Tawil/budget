"use client";

import type { SpendCategory } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard, CardLabel } from "./glass-card";
import { DonutChart } from "./charts";

const SPENDING_TRACK = "oklch(92% 0.006 80)";
const ovLabelCls = "text-[11px] font-medium tracking-[0.07em] uppercase text-muted-text";

export function Spending({ data }: { data: SpendCategory[] }) {
  const totalActual = data.reduce((s, c) => s + c.amount, 0);
  const totalBudget = data.reduce((s, c) => s + c.budget, 0);
  const remaining = totalBudget - totalActual;

  return (
    <div className="tab-content flex flex-col gap-10 sm:gap-14 w-full max-w-[1080px] mx-auto">
      {/* ── HERO · Budget vs Actual ──────────────────────────────────── */}
      <GlassCard className="p-8 sm:p-12">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className={ovLabelCls}>Spending</div>
            <div className="font-serif text-[clamp(3.25rem,9vw,5rem)] tracking-[-0.035em] leading-[0.92] mt-4 tabular-nums">
              {fmt(totalActual)}{" "}
              <span className="text-[15px] sm:text-base text-muted-text font-normal font-sans">
                of {fmt(totalBudget)}
              </span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[13px] font-bold px-2.5 py-1 rounded-full ${
              remaining >= 0 ? "bg-sage-light text-sage" : "bg-terra-light text-terra"
            }`}
          >
            {remaining >= 0 ? `${fmt(remaining)} remaining` : `${fmt(Math.abs(remaining))} over`}
          </span>
        </div>
      </GlassCard>

      {/* ── Budget vs Actual · per-category bars ─────────────────────── */}
      <GlassCard>
        <CardLabel>Budget vs. Actual</CardLabel>
        {data.length > 0 ? (
          <div className="mt-2">
            {data.map((c) => {
              const pct = c.budget > 0 ? Math.min((c.amount / c.budget) * 100, 100) : 0;
              const over = c.amount > c.budget;
              return (
                <div key={c.name} className="flex items-center gap-3 mb-5 last:mb-0">
                  <span className="text-[13px] font-medium w-[90px] shrink-0">{c.name}</span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: SPENDING_TRACK }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                      style={{ width: `${pct}%`, background: over ? "var(--color-terra)" : c.color }}
                    />
                  </div>
                  <div className="flex gap-1.5 text-xs shrink-0 min-w-[120px] justify-end tabular-nums">
                    <span className={`font-semibold ${over ? "text-terra" : ""}`}>{fmt(c.amount)}</span>
                    <span className="text-muted-text">/ {fmt(c.budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-text">No spending data this month</p>
        )}
      </GlassCard>

      {/* ── Category Breakdown · donut + legend ──────────────────────── */}
      <GlassCard>
        <CardLabel>Category Breakdown</CardLabel>
        {data.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center mt-4">
            <div className="flex justify-center lg:justify-start">
              <DonutChart data={data} size={180} stroke={26} />
            </div>
            <div className="flex-1 flex flex-col gap-2.5">
              {data.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px]">
                    <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: c.color }} />
                    <span>{c.name}</span>
                  </div>
                  <div className="flex gap-3 tabular-nums">
                    <span className="text-xs text-muted-text">{c.pct}%</span>
                    <span className="text-[13px] font-semibold">{fmt(c.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-text mt-4">No data yet</p>
        )}
      </GlassCard>
    </div>
  );
}
