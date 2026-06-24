"use client";

import type { SpendCategory } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard, CardLabel, CardValue } from "./glass-card";
import { DonutChart } from "./charts";

export function Spending({ data }: { data: SpendCategory[] }) {
  const totalActual = data.reduce((s, c) => s + c.amount, 0);
  const totalBudget = data.reduce((s, c) => s + c.budget, 0);
  const remaining = totalBudget - totalActual;

  return (
    <div className="tab-content grid grid-cols-3 gap-3.5">
      {/* Budget vs Actual */}
      <GlassCard className="col-span-3">
        <div className="flex justify-between items-center mb-5">
          <div>
            <CardLabel>Budget vs. Actual</CardLabel>
            <CardValue className="text-[28px]">
              {fmt(totalActual)} <span className="text-sm text-muted-text font-normal font-sans">of {fmt(totalBudget)}</span>
            </CardValue>
          </div>
          <span className={`inline-flex items-center gap-1 text-[13px] font-bold px-2.5 py-1 rounded-full ${
            remaining >= 0 ? "bg-sage-light text-sage" : "bg-terra-light text-terra"
          }`}>
            {remaining >= 0 ? `${fmt(remaining)} remaining` : `${fmt(Math.abs(remaining))} over`}
          </span>
        </div>
        {data.length > 0 ? (
          data.map((c) => {
            const pct = c.budget > 0 ? Math.min((c.amount / c.budget) * 100, 100) : 0;
            const over = c.amount > c.budget;
            return (
              <div key={c.name} className="flex items-center gap-3 mb-3.5">
                <span className="text-[13px] font-medium w-[90px] shrink-0">{c.name}</span>
                <div className="flex-1 h-2 bg-[oklch(100%_0_0/0.12)] rounded-full overflow-visible relative">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                    style={{ width: `${pct}%`, background: over ? "oklch(63% 0.1 38)" : c.color }}
                  />
                </div>
                <div className="flex gap-1.5 text-xs shrink-0 min-w-[120px] justify-end">
                  <span className="font-semibold" style={{ color: over ? "oklch(63% 0.1 38)" : undefined }}>{fmt(c.amount)}</span>
                  <span className="text-muted-text">/ {fmt(c.budget)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-text">No spending data this month</p>
        )}
      </GlassCard>

      {/* Category Breakdown */}
      <GlassCard className="col-span-2">
        <CardLabel>Category Breakdown</CardLabel>
        {data.length > 0 ? (
          <div className="flex items-center gap-6 mt-4">
            <DonutChart data={data} size={180} stroke={26} />
            <div className="flex-1 flex flex-col gap-2.5">
              {data.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px]">
                    <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: c.color }} />
                    <span>{c.name}</span>
                  </div>
                  <div className="flex gap-3">
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

      {/* Monthly Summary */}
      <GlassCard>
        <CardLabel>Summary</CardLabel>
        <div className="space-y-3 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-text">Total Budget</span>
            <span className="font-semibold">{fmt(totalBudget)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-text">Total Spent</span>
            <span className="font-semibold">{fmt(totalActual)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-[oklch(90%_0.01_80/0.5)]">
            <span className="text-muted-text">Remaining</span>
            <span className={`font-bold ${remaining >= 0 ? "text-sage" : "text-terra"}`}>
              {remaining >= 0 ? fmt(remaining) : `-${fmt(Math.abs(remaining))}`}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
