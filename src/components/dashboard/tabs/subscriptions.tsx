"use client";

import type { SubscriptionView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard, CardLabel } from "@/components/dashboard/primitives/glass-card";
import { TxIcon } from "@/components/dashboard/primitives/tx-icon";

const STAT_DIVIDER = "oklch(90% 0.006 80)";
const SPENDING_TRACK = "oklch(92% 0.006 80)";
const ovLabelCls = "text-[11px] font-medium tracking-[0.07em] uppercase text-muted-text";

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
    <div className="tab-content flex flex-col gap-10 sm:gap-14 w-full max-w-[1080px] mx-auto">
      {/* ── HERO · subscription summary ──────────────────────────────── */}
      <GlassCard className="p-8 sm:p-12">
        <div className={ovLabelCls}>Active Subscriptions</div>
        <div className="font-serif text-[clamp(3.25rem,9vw,5rem)] tracking-[-0.035em] leading-[0.92] mt-4 tabular-nums">
          {fmt(total)}
          <span className="text-sm text-muted-text font-normal font-sans">/mo</span>
        </div>
        <div className="mt-5 pt-5 border-t" style={{ borderColor: STAT_DIVIDER }}>
          <div className="text-[13px] text-muted-text tabular-nums">
            {fmt(annualFromMonthly + annualSubs)}/year · {data.length} services
          </div>
          {flaggedCount > 0 && (
            <div className="text-[13px] text-terra font-semibold mt-2">
              <span className="text-[15px]">{flaggedCount}</span> subscription
              {flaggedCount === 1 ? "" : "s"} need attention
            </div>
          )}
        </div>
      </GlassCard>

      {/* ── Services + Annual Projection · 2-up ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Service list */}
        <GlassCard>
          <CardLabel>Services</CardLabel>
          {data.length > 0 ? (
            <div className="mt-2 max-h-[420px] overflow-y-auto custom-scrollbar">
              {data.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors hover:bg-[oklch(100%_0_0/0.1)]"
                >
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: s.color }}
                  >
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
                      {s.categoryName && <span className="ml-1 opacity-80">· {s.categoryName}</span>}
                    </div>
                  </div>
                  <div className="text-[13px] font-bold tabular-nums">{fmt(s.amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-text mt-2">No subscriptions tracked yet</p>
          )}
        </GlassCard>

        {/* Annual Projection */}
        <GlassCard>
          <CardLabel>Annual Projection</CardLabel>
          {data.length > 0 ? (
            <div className="mt-2">
              {data.map((s) => {
                const annualCost = s.cycle === "Annual" ? s.amount : s.amount * 12;
                return (
                  <div key={s.id} className="flex items-center gap-3 mb-2.5">
                    <span className="text-xs font-medium w-[90px] shrink-0">{s.name}</span>
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: SPENDING_TRACK }}
                    >
                      <div
                        className="h-full rounded-full bg-slate-brand"
                        style={{ width: `${(s.amount / (total || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold min-w-[60px] text-right tabular-nums">
                      {fmt(annualCost)}/yr
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-text mt-2">No data</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
