"use client";

import { useState } from "react";
import type { DashboardOverview, InsightView, TransactionView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard } from "./glass-card";
import { LineChart, NWChart } from "./charts";
import { TxRow } from "./tx-row";
import { EditTransactionModal } from "./edit-tx-modal";
import { Sparkles } from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SPENDING_TRACK = "oklch(92% 0.006 80)";
const ROW_DIVIDER = "oklch(93% 0.005 80)";
const TX_DIVIDER = "oklch(94% 0.004 80)";
const STAT_DIVIDER = "oklch(90% 0.006 80)";

const ovDarkCardCls =
  "relative overflow-hidden rounded-[22px] p-6 sm:p-8 text-white " +
  "bg-[oklch(14%_0.016_260/0.72)] backdrop-blur-[40px] backdrop-saturate-[1.8] " +
  "border border-[oklch(100%_0_0/0.1)] " +
  "[border-top-color:oklch(100%_0_0/0.18)] [border-left-color:oklch(100%_0_0/0.18)] " +
  "shadow-[0_2px_0_oklch(100%_0_0/0.06)_inset,0_24px_64px_oklch(16%_0.02_260/0.22)] " +
  "transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";

const ovLabelCls =
  "text-[11px] font-medium tracking-[0.07em] uppercase text-muted-text";

interface OverviewProps {
  data: DashboardOverview;
  month?: number;
  year?: number;
  insights?: InsightView[];
  onShowInsights?: () => void;
  onShowTransactions?: () => void;
  onRefresh?: () => void;
}

export function Overview({
  data,
  month,
  year,
  insights = [],
  onShowInsights,
  onShowTransactions,
  onRefresh,
}: OverviewProps) {
  const [editTx, setEditTx] = useState<TransactionView | null>(null);

  const {
    netWorth,
    netWorthChange,
    monthlyIncome,
    monthlySpend,
    monthlySurplus,
    budgetTarget,
    currency,
    spendingByCategory,
    upcomingBills,
    incomeVsExpense,
    netWorthTrend,
    goals,
    recentTransactions,
  } = data;

  const now = new Date();
  const monthLabel = (month ? MONTH_NAMES[month - 1] : MONTH_NAMES[now.getMonth()]).toUpperCase();
  const yearLabel = year ?? now.getFullYear();
  const cashFlowHeader = `Cash Flow · ${monthLabel} ${yearLabel}`;

  const remaining = budgetTarget - monthlySpend;
  const surplus = monthlySurplus;
  const surplusPositive = surplus >= 0;

  const nwMin = netWorthTrend.length ? Math.min(...netWorthTrend) : 0;
  const nwMax = netWorthTrend.length ? Math.max(...netWorthTrend) : 1;
  const nwRange = Math.max(1, nwMax - nwMin);

  const visibleInsights = insights.slice(0, 3);
  const hasInsights = visibleInsights.length > 0;

  return (
    <div className="tab-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {/* ── ROW 1 ───────────────────────────────────────────────────── */}

      {/* Net Worth */}
      <GlassCard>
        <div className={ovLabelCls}>Net Worth</div>
        <div className="font-serif text-[44px] sm:text-[52px] tracking-[-0.03em] leading-none mt-3.5">
          {fmt(netWorth, currency)}
        </div>
        <div className="text-[13px] text-muted-text mt-2">{currency} · All accounts</div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold mt-2.5 ${
            netWorthChange >= 0 ? "text-sage" : "text-terra"
          }`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: netWorthChange >= 0 ? "var(--color-sage)" : "var(--color-terra)" }}
          />
          {netWorthChange >= 0 ? "↑" : "↓"} {fmt(netWorthChange, currency)} this month
        </div>
        {netWorthTrend.length > 1 && <NWChart data={netWorthTrend} />}
        {incomeVsExpense.months.length > 0 && (
          <div className="flex justify-between mt-1.5">
            {incomeVsExpense.months.map((m) => (
              <span key={m} className="text-[9px] text-muted-text tracking-[0.04em]">
                {m}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Cash Flow */}
      <GlassCard className="md:col-span-1 lg:col-span-2">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="flex flex-col gap-5 flex-1 min-w-[260px]">
            <div className={ovLabelCls}>{cashFlowHeader}</div>
            <div className="flex items-baseline gap-5 flex-wrap">
              <div>
                <div className="text-[11px] text-muted-text mb-1">Income</div>
                <div className="font-serif text-[26px] sm:text-[28px] tracking-[-0.03em] text-sage leading-none">
                  {fmt(monthlyIncome, currency)}
                </div>
              </div>
              <div className="w-px h-10 self-center" style={{ background: STAT_DIVIDER }} />
              <div>
                <div className="text-[11px] text-muted-text mb-1">Expenses</div>
                <div className="font-serif text-[26px] sm:text-[28px] tracking-[-0.03em] leading-none">
                  {fmt(monthlySpend, currency)}
                </div>
              </div>
              <div className="w-px h-10 self-center" style={{ background: STAT_DIVIDER }} />
              <div>
                <div className="text-[11px] text-muted-text mb-1">
                  {surplusPositive ? "Surplus" : "Deficit"}
                </div>
                <div
                  className={`font-serif text-[26px] sm:text-[28px] tracking-[-0.03em] leading-none ${
                    surplusPositive ? "text-sage" : "text-terra"
                  }`}
                >
                  {surplusPositive ? "+" : "−"}
                  {fmt(surplus, currency)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-text">
              <div className="w-[18px] h-[2.5px] rounded-sm bg-sage" />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-text">
              <div className="w-[18px] h-[2.5px] rounded-sm bg-terra" />
              <span>Expenses</span>
            </div>
          </div>
        </div>
        {incomeVsExpense.months.length > 0 && (
          <div className="mt-5">
            <LineChart
              incomeData={incomeVsExpense.income}
              expenseData={incomeVsExpense.expenses}
              labels={incomeVsExpense.months}
              height={110}
            />
          </div>
        )}
      </GlassCard>

      {/* ── ROW 2 ───────────────────────────────────────────────────── */}

      {/* Monthly Surplus */}
      <GlassCard>
        <div className={ovLabelCls}>Monthly Surplus</div>
        <div
          className={`font-serif text-[44px] sm:text-[52px] tracking-[-0.03em] leading-none mt-3.5 ${
            surplusPositive ? "text-sage" : "text-terra"
          }`}
        >
          {surplusPositive ? "+" : "−"}
          {fmt(surplus, currency)}
        </div>
        <div className="text-[13px] text-muted-text mt-2">
          {surplusPositive ? "You saved this month" : "Spending exceeded income"}
        </div>
        <div
          className="mt-4 pt-3.5 grid grid-cols-2 gap-4 border-t"
          style={{ borderColor: STAT_DIVIDER }}
        >
          <div>
            <div className="text-[11px] text-muted-text mb-1">Income</div>
            <div className="font-serif text-[20px] tracking-[-0.02em] leading-none text-sage tabular-nums">
              {fmt(monthlyIncome, currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-text mb-1">Expenses</div>
            <div className="font-serif text-[20px] tracking-[-0.02em] leading-none tabular-nums">
              {fmt(monthlySpend, currency)}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Spending */}
      <GlassCard>
        <div className="flex justify-between items-center mb-5">
          <div className={ovLabelCls}>Spending</div>
          <span className="text-[11px] text-muted-text tabular-nums">
            {fmt(monthlySpend, currency)}
            {budgetTarget > 0 ? ` of ${fmt(budgetTarget, currency)}` : ""}
          </span>
        </div>
        {spendingByCategory.length > 0 ? (
          <>
            {spendingByCategory.slice(0, 5).map((c) => {
              const pct = c.budget > 0 ? Math.min((c.amount / c.budget) * 100, 100) : 0;
              return (
                <div key={c.name} className="mb-3.5">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-medium">{c.name}</span>
                    <span className="text-[13px] text-muted-text tabular-nums">
                      {fmt(c.amount, currency)}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: SPENDING_TRACK }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </div>
              );
            })}
            {budgetTarget > 0 && (
              <div
                className="mt-1 pt-3.5 flex justify-between border-t"
                style={{ borderColor: SPENDING_TRACK }}
              >
                <span className="text-xs text-muted-text">
                  {remaining >= 0 ? "Budget remaining" : "Over budget"}
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    remaining >= 0 ? "text-sage" : "text-terra"
                  }`}
                >
                  {fmt(remaining, currency)}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-text">No spending data yet.</p>
        )}
      </GlassCard>

      {/* Savings Goals */}
      <GlassCard>
        <div className={`${ovLabelCls} mb-5`}>Savings Goals</div>
        {goals.length > 0 ? (
          goals.slice(0, 4).map((g, i) => {
            const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
            const last = i === Math.min(goals.length, 4) - 1;
            return (
              <div key={g.id} className={last ? "" : "mb-5"}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[13px] font-medium">{g.name}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: g.color }}>
                    {pct}%
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden mb-1.5"
                  style={{ background: SPENDING_TRACK }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                    style={{ width: `${Math.min(pct, 100)}%`, background: g.color }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-text">
                  <span className="tabular-nums">{fmt(g.saved, currency)} saved</span>
                  <span>{g.deadline}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-text">No goals yet. Create one in the Goals tab!</p>
        )}
      </GlassCard>

      {/* Upcoming Bills */}
      <GlassCard>
        <div className={`${ovLabelCls} mb-2`}>Upcoming Bills</div>
        {upcomingBills.length > 0 ? (
          upcomingBills.slice(0, 5).map((b, i, arr) => (
            <div
              key={b.id}
              className="flex items-center justify-between py-[13px]"
              style={{
                borderBottom: i < arr.length - 1 ? `1px solid ${ROW_DIVIDER}` : "none",
              }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{b.name}</div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: b.urgent ? "var(--color-terra)" : "var(--color-muted-text)" }}
                >
                  {b.urgent ? "⚡ " : ""}Due {b.due}
                </div>
              </div>
              <div className="text-sm font-semibold tabular-nums shrink-0 ml-3">
                {fmt(b.amount, currency)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-text mt-2">No upcoming bills</p>
        )}
      </GlassCard>

      {/* ── ROW 3 ───────────────────────────────────────────────────── */}

      {/* Recent Transactions */}
      <GlassCard className="md:col-span-2">
        <div className="flex justify-between items-center mb-5">
          <div className={ovLabelCls}>Recent Transactions</div>
          <button
            type="button"
            onClick={onShowTransactions}
            className="text-xs text-sage font-semibold tracking-[0.02em] cursor-pointer hover:underline"
          >
            See all →
          </button>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="max-h-[340px] overflow-y-auto custom-scrollbar -mx-3">
            {recentTransactions.slice(0, 8).map((tx, i, arr) => (
              <div
                key={tx.id}
                style={{
                  borderBottom: i < arr.length - 1 ? `1px solid ${TX_DIVIDER}` : "none",
                }}
              >
                <TxRow tx={tx} currency={currency} onDoubleClick={setEditTx} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-text">No transactions yet</p>
        )}
      </GlassCard>

      {/* AI Insight (dark glass) */}
      <div className={ovDarkCardCls}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-sage">
            Bulga AI
          </div>
          {hasInsights && (
            <button
              onClick={onShowInsights}
              className="text-[10px] font-semibold tracking-[0.04em] text-sage hover:underline cursor-pointer"
            >
              See all →
            </button>
          )}
        </div>

        {hasInsights ? (
          <>
            <div className="font-serif text-[22px] tracking-[-0.02em] leading-[1.3] mb-5 text-white">
              Latest from your AI advisor.
            </div>
            <div className="flex flex-col gap-3">
              {visibleInsights.map((ins) => (
                <div key={ins.id} className="flex items-start gap-2.5">
                  <div
                    className="w-[5px] h-[5px] rounded-full shrink-0 mt-[7px]"
                    style={{ background: ins.tagColor }}
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-0.5"
                      style={{ color: ins.tagColor }}
                    >
                      {ins.tag}
                    </div>
                    <span
                      className="text-[13px] leading-[1.55] line-clamp-2"
                      style={{ color: "oklch(78% 0.01 80)" }}
                    >
                      {ins.body}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="font-serif text-[22px] tracking-[-0.02em] leading-[1.3] mb-2 text-white">
              No insights generated yet.
            </div>
            <p
              className="text-[13px] leading-[1.55] mb-5"
              style={{ color: "oklch(72% 0.01 80)" }}
            >
              Get AI-powered analysis of your spending patterns, savings opportunities, and trends.
            </p>
            <button
              type="button"
              onClick={onShowInsights}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage text-white text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate in Insights tab
            </button>
          </>
        )}

        {netWorthTrend.length > 0 && (
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid oklch(28% 0.012 260)" }}>
            <div className="text-[11px] mb-3" style={{ color: "oklch(48% 0.01 260)" }}>
              Net worth trend
            </div>
            <div className="flex justify-between items-end gap-[3px] h-8">
              {netWorthTrend.map((v, i) => {
                const h = 8 + ((v - nwMin) / nwRange) * 24;
                const last = i === netWorthTrend.length - 1;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-[3px]"
                    style={{
                      height: h,
                      background: last ? "var(--color-sage)" : "oklch(32% 0.012 260)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <EditTransactionModal
        open={!!editTx}
        transaction={editTx}
        onClose={() => setEditTx(null)}
        onUpdated={() => onRefresh?.()}
      />
    </div>
  );
}
