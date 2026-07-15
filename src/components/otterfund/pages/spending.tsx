"use client";

// otterfund — SPENDING page (the statement).
//
// Built around the user's budget plan (Needs / Wants / Savings). A hero shows
// spend-of-budget for the month; then three flowing sections on the paper — a
// dual donut contrasting the plan's target split with this month's actual, the
// per-bucket progress (actual vs target, clay when a spend bucket is over), and
// a category breakdown grouped under each bucket. Recurring charges fold in at
// the end. No bordered cards: sections are divided by space + hairlines, one
// accent leads, and colour survives only in the data (donut shades, category
// dots). Every figure derives from `plan`.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SpendingPlanView, SpendingBucket, SubscriptionView } from "@/lib/types";
import { type OtterfundTheme, hueOf } from "@/components/otterfund/theme";
import { getBudgetPlan } from "@/lib/constants";
import { fmt } from "@/lib/format";
import { ProgressBar } from "@/components/otterfund/progress";
import { DonutChart } from "@/components/otterfund/donut-chart";
import { Statement, HeroBand, SectionHead, Ledger, Row } from "@/components/otterfund/ledger";
import { AddAccountEmptyState } from "@/components/otterfund/empty-state";
import { OtterfundSubscriptions } from "@/components/otterfund/pages/subscriptions";

interface OtterfundSpendingProps {
  plan: SpendingPlanView;
  accent: string;
  theme: OtterfundTheme;
  /** Recurring charges, rendered as the "Recurring" section (formerly a tab). */
  subscriptions: SubscriptionView[];
  currency: string;
  /** False when the user has no accounts at all — with no income or spend, the
      page shows an "add an account" cold start instead of empty donuts/buckets. */
  hasAccounts?: boolean;
  onAddAccount?: () => void;
  onConnect?: () => void;
  onAddSubscription?: () => void;
  onEditSubscription?: (s: SubscriptionView) => void;
  /** Link to Goals (where the savings pool is allocated to goals). */
  goalsHref: string;
}

// Tiny uppercase label — the donut's inner captions ("Target" / "Spent").
const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-of-faint)",
};

export function OtterfundSpending({ plan, accent, theme, subscriptions, currency: currencyProp, hasAccounts = true, onAddAccount, onConnect, onAddSubscription, onEditSubscription, goalsHref }: OtterfundSpendingProps) {
  const currency = plan.currency || currencyProp;
  const money = (n: number) => fmt(n, currency);

  // Cold start — no accounts, and nothing to build a budget from (no income set,
  // no spending). The donut/bucket UI would only render as empty rings, so pivot
  // to the "add an account" surface instead.
  if (!hasAccounts && plan.monthlyIncome === 0 && plan.totalSpent === 0) {
    return (
      <Statement>
        <AddAccountEmptyState
          theme={theme}
          onAdd={onAddAccount}
          onConnect={onConnect}
          title="Add an account to track spending"
          description="Connect a bank or add an account, and your spending will sort itself into needs, wants and savings against your budget."
        />
      </Statement>
    );
  }
  const hue = hueOf(theme.accent);
  const planMeta = getBudgetPlan(plan.planId);

  // Three cohesive shades of the active accent hue, one per bucket — a single-hue
  // data ramp shared by the donut, the legend, and the bucket bars so the three
  // always read as the same encoding.
  const bucketColor: Record<SpendingBucket["key"], string> = {
    needs: theme.accentDeep,
    wants: theme.accent,
    savings: `oklch(75% 0.07 ${hue})`,
  };

  const needs = plan.buckets.find((b) => b.key === "needs")!;
  const wants = plan.buckets.find((b) => b.key === "wants")!;
  const savings = plan.buckets.find((b) => b.key === "savings")!;

  const income = plan.monthlyIncome;
  const totalSpent = plan.totalSpent;
  const spendBudget = needs.targetAmount + wants.targetAmount;
  const hasIncome = income > 0;
  // Legend shares the donut's denominator (sum of actual segment values) so the
  // two always agree and the percentages total 100% — even when overspending
  // floors savings at 0 and the segments sum to totalSpent instead of income.
  const actualDenom = plan.buckets.reduce((s, b) => s + b.actualAmount, 0);

  const targetSegments = plan.buckets.map((b) => ({ value: b.targetPct, color: bucketColor[b.key], label: b.label }));
  const actualSegments = plan.buckets.map((b) => ({ value: b.actualAmount, color: bucketColor[b.key], label: b.label }));

  return (
    <Statement>
      {/* ── hero · spent of budget ── */}
      <HeroBand
        theme={theme}
        ariaLabel="Spending this month"
        eyebrow={
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-of-muted)" }}>
            Spending this month
          </div>
        }
        figure={
          <>
            {money(totalSpent)}{" "}
            <span style={{ fontSize: 18, color: "var(--color-of-muted)", fontWeight: 400 }}>of {money(spendBudget)}</span>
          </>
        }
      />

      {/* ── plan vs. actual · dual donut ── */}
      <section style={{ marginTop: 32 }}>
        <SectionHead title="Plan vs. actual" action={<span style={{ fontSize: 12.5, color: "var(--color-of-faint)" }}>{planMeta.name}</span>} />
        <p style={{ fontSize: 12.5, color: "var(--color-of-muted)", margin: "0 0 22px" }}>
          How your income should split, next to how you actually used it this month.
        </p>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <DonutChart segments={targetSegments}>
              <span style={EYEBROW}>Target</span>
              <span className="of-num" style={{ fontSize: 15, fontWeight: 500 }}>{planMeta.name.split(" ")[0]}</span>
            </DonutChart>
            <span style={{ ...EYEBROW, fontSize: 11.5 }}>Your plan</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <DonutChart segments={actualSegments}>
              <span style={EYEBROW}>Spent</span>
              <span className="of-num" style={{ fontSize: 19, fontWeight: 500 }}>{money(totalSpent)}</span>
            </DonutChart>
            <span style={{ ...EYEBROW, fontSize: 11.5 }}>This month</span>
          </div>
        </div>

        {/* legend — target vs actual share of income per bucket */}
        <div style={{ marginTop: 24, display: "grid", gap: 11 }}>
          {plan.buckets.map((b) => {
            const actualPct = actualDenom > 0 ? Math.round((b.actualAmount / actualDenom) * 100) : 0;
            return (
              <div key={b.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: bucketColor[b.key], flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{b.label}</span>
                </span>
                <span className="of-num" style={{ color: "var(--color-of-muted)" }}>
                  <span style={{ color: "var(--color-of-faint)" }}>target</span> {b.targetPct}%
                  <span style={{ color: "var(--color-of-faint)" }}> · actual</span> {actualPct}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── per-bucket bars · actual vs target ── */}
      <section style={{ marginTop: 34 }}>
        <SectionHead
          title="Bucket progress"
          action={!hasIncome ? <span style={{ fontSize: 12.5, color: "var(--color-of-clay)" }}>Add income in Settings for targets</span> : undefined}
        />
        <Ledger style={{ marginTop: 4 }}>
          {plan.buckets.map((b) => {
            const isSavings = b.key === "savings";
            const pct = b.targetAmount > 0 ? Math.min((b.actualAmount / b.targetAmount) * 100, 100) : 0;
            const over = !isSavings && b.targetAmount > 0 && b.actualAmount > b.targetAmount;
            return (
              <Row key={b.key} columns="1fr" padding="14px 12px">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>
                      {b.label} <span style={{ color: "var(--color-of-faint)", fontWeight: 400 }}>· {b.targetPct}%</span>
                    </span>
                    <span className="of-num" style={{ color: over ? theme.clay : "var(--color-of-muted)" }}>
                      {money(b.actualAmount)} <span style={{ color: "var(--color-of-faint)" }}>/ {money(b.targetAmount)}</span>
                    </span>
                  </div>
                  <ProgressBar value={pct} color={over ? theme.clay : bucketColor[b.key]} />
                </div>
              </Row>
            );
          })}
        </Ledger>
      </section>

      {/* ── category breakdown · grouped by bucket ── */}
      <section style={{ marginTop: 34 }}>
        <SectionHead title="Category breakdown" />
        {[needs, wants, savings].map((bucket) => {
          const isSavings = bucket.key === "savings";
          // Savings lists the goals it funds (planned contributions), so the
          // header sums those rather than the virtual surplus.
          const headerAmount = isSavings ? bucket.categories.reduce((s, c) => s + c.amount, 0) : bucket.actualAmount;
          return (
            <div key={bucket.key} style={{ marginTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: bucketColor[bucket.key], flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-of-muted)" }}>
                  {isSavings ? "Savings · to goals" : bucket.label}
                </span>
                <span className="of-num" style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--color-of-faint)" }}>
                  {money(headerAmount)}
                </span>
              </div>
              {bucket.categories.length > 0 ? (
                <Ledger>
                  {bucket.categories.map((c) => (
                    <Row key={c.categoryId} columns="1fr auto" gap={14} padding="11px 12px">
                      <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, minWidth: 0 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 999, background: c.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                        <span className="of-num" style={{ fontSize: 12.5, color: "var(--color-of-faint)" }}>{c.pctOfBucket}%</span>
                        <span className="of-num" style={{ fontSize: 14, fontWeight: 500 }}>{money(c.amount)}</span>
                      </div>
                    </Row>
                  ))}
                </Ledger>
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-of-muted)", padding: "8px 0 2px" }}>
                  {isSavings ? "No goals funded yet. Add goals to direct your savings." : "No spending in this bucket yet."}
                </p>
              )}
              {/* Savings flows to goals — allocate it where it's actually done. */}
              {isSavings && (
                <Link
                  href={`${goalsHref}${goalsHref.includes("?") ? "&" : "?"}allocate=1`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 12.5, fontWeight: 600, color: theme.accentDeep, textDecoration: "none" }}
                >
                  Allocate savings to goals
                  <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              )}
            </div>
          );
        })}
      </section>

      {/* ── recurring · subscriptions, folded in from the old tab ── */}
      <OtterfundSubscriptions
        embedded
        subscriptions={subscriptions}
        accent={accent}
        theme={theme}
        currency={currency}
        onAdd={onAddSubscription}
        onEdit={onEditSubscription}
      />
    </Statement>
  );
}
