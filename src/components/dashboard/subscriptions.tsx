"use client";

import type { SubscriptionView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard, CardLabel, CardValue } from "./glass-card";
import { TxIcon } from "./tx-icon";

function flagBadge(flag: string) {
  const isPriceChange = flag.toLowerCase().startsWith("price");
  const tone = isPriceChange
    ? "bg-[oklch(94%_0.06_75)] text-[oklch(45%_0.13_55)]"
    : "bg-[oklch(96%_0.07_95)] text-[oklch(45%_0.12_85)]";
  const label = isPriceChange ? "Price up" : "Unused?";
  return { tone, label };
}

export function Subscriptions({ data }: { data: SubscriptionView[] }) {
  const monthlyTotal = data
    .filter((s) => s.cycle === "Monthly")
    .reduce((sum, s) => sum + s.amount, 0);
  const annualFromMonthly = monthlyTotal * 12;
  const annualSubs = data
    .filter((s) => s.cycle === "Annual")
    .reduce((sum, s) => sum + s.amount, 0);
  const total = monthlyTotal + annualSubs / 12;

  const flaggedCount = data.filter((s) => s.flags.length > 0).length;

  return (
    <div className="tab-content grid grid-cols-2 gap-3.5">
      <GlassCard>
        <CardLabel>Active Subscriptions</CardLabel>
        <CardValue className="text-[28px] mb-1">
          {fmt(total)}<span className="text-sm text-muted-text font-normal font-sans">/mo</span>
        </CardValue>
        <div className="text-xs text-muted-text">{fmt(annualFromMonthly + annualSubs)}/year · {data.length} services</div>
        {flaggedCount > 0 && (
          <div className="text-xs font-semibold mt-2 text-[oklch(50%_0.13_55)]">
            {flaggedCount} subscription{flaggedCount === 1 ? "" : "s"} need attention
          </div>
        )}
        {data.length > 0 ? (
          <div className="mt-5">
            {data.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors hover:bg-[oklch(100%_0_0/0.1)]">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: s.color }}>
                  <TxIcon icon={s.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-semibold truncate">{s.name}</span>
                    {s.flags.map((flag) => {
                      const { tone, label } = flagBadge(flag);
                      return (
                        <span
                          key={flag}
                          title={flag}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tone}`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-muted-text">
                    {s.cycle}
                    {s.categoryName && (
                      <span className="ml-1 opacity-80">· {s.categoryName}</span>
                    )}
                  </div>
                </div>
                <div className="text-[13px] font-bold">{fmt(s.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-text mt-5">No subscriptions tracked yet</p>
        )}
      </GlassCard>

      <div className="flex flex-col gap-3.5">
        <GlassCard>
          <CardLabel>Annual Projection</CardLabel>
          {data.length > 0 ? (
            data.map((s) => {
              const annualCost = s.cycle === "Annual" ? s.amount : s.amount * 12;
              return (
                <div key={s.id} className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs font-medium w-[90px] shrink-0">{s.name}</span>
                  <div className="flex-1 h-2 bg-[oklch(100%_0_0/0.12)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-brand"
                      style={{ width: `${(s.amount / (total || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold min-w-[60px] text-right">{fmt(annualCost)}/yr</span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-text mt-2">No data</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
