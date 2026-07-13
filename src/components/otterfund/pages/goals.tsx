"use client";

// otterfund — GOALS page (the statement).
//
// Goals are the destination of the plan's monthly Savings. The budget plan sets
// a savings amount (income × savings%); that pool splits across under-funded
// goals by priority. The page makes that concrete: a hero of the total saved and
// the monthly pool, then a two-up grid of minted goal cards — each a bordered
// <Panel> with its progress ring, pacing, a Saved · Target · To go split, and the
// $/month it draws toward a projected finish. Every figure derives from `plan`.

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { GoalPlanItem, GoalsPlanView, GoalView } from "@/lib/types";
import type { OtterfundTheme } from "@/components/otterfund/theme";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/otterfund/progress";
import { GuillocheSeal } from "@/components/otterfund/guilloche";
import { Statement, HeroBand } from "@/components/otterfund/ledger";
import { Panel } from "@/components/otterfund/panel";
import { useOtterfundChrome } from "@/components/otterfund/chrome-context";
import { AllocateSavingsModal } from "@/components/dashboard/modals/allocate-savings-modal";

interface OtterfundGoalsProps {
  plan: GoalsPlanView;
  accent: string;
  theme: OtterfundTheme;
  onAdd?: () => void;
  onEdit?: (g: GoalView) => void;
}

function priorityLabel(p: number): "Low" | "Medium" | "High" {
  if (p === 1) return "Low";
  if (p === 3) return "High";
  return "Medium";
}

export function OtterfundGoals({ plan, accent, theme, onAdd, onEdit }: OtterfundGoalsProps) {
  const { currency, goals, monthlySavings, surplus, totalSaved, totalTarget, assignable } = plan;

  const fmt0 = (n: number) =>
    new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.abs(n));

  const hasPool = monthlySavings > 0;

  const { refreshData } = useOtterfundChrome();
  const [allocateOpen, setAllocateOpen] = useState(false);

  // Allocate is only actionable when there's real cash left AND a goal to take
  // it. Otherwise the button stays visible but grayed, with a reason on hover.
  const canAssign = assignable > 0 && goals.some((g) => g.remaining > 0);

  // Deep-link from Spending's Savings bucket (?allocate=1) opens the modal
  // straight away, then the param is stripped so a refresh doesn't reopen it.
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("allocate") !== "1") return;
    if (canAssign) setAllocateOpen(true);
    router.replace("/dashboard/goals", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const assignReason =
    surplus <= 0
      ? "No surplus to allocate this month"
      : assignable <= 0
        ? "Surplus already allocated for the month"
        : "All goals are fully funded";

  return (
    <Statement>
      {/* ── hero ── */}
      <HeroBand
        theme={theme}
        ariaLabel="Saved across goals"
        asideAlign="start"
        divider={goals.length > 0}
        eyebrow={
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-of-muted)" }}>
            Saved across goals
          </div>
        }
        figure={fmt0(totalSaved)}
        meta={
          <div style={{ fontSize: 13, color: "var(--color-of-muted)" }}>
            of {fmt0(totalTarget)} target · {goals.length} active {goals.length === 1 ? "goal" : "goals"}
            {hasPool && (
              <>
                {" · "}
                <span className="of-num" style={{ color: theme.accentDeep }}>{fmt0(monthlySavings)}</span>/mo to set aside
              </>
            )}
          </div>
        }
        aside={
          <div style={{ display: "flex", gap: 8 }}>
            {goals.length > 0 && hasPool && (
              <span className="group relative inline-flex">
                <Button size="sm" onClick={() => setAllocateOpen(true)} disabled={!canAssign}>
                  Allocate
                </Button>
                {!canAssign && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-max max-w-[260px] translate-y-1 whitespace-normal rounded-[9px] px-2.5 py-1.5 text-left text-[12px] font-medium leading-snug opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100"
                    style={{ background: "oklch(26% 0.012 75)", color: "#fff", boxShadow: "0 8px 24px oklch(20% 0.02 80 / 0.3)" }}
                  >
                    {assignReason}
                  </span>
                )}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => onAdd?.()} className="border-dashed">
              <Plus data-icon="inline-start" size={16} strokeWidth={2.2} />
              New goal
            </Button>
          </div>
        }
      />

      {goals.length === 0 ? (
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ width: 72, height: 72, marginBottom: 8 }} aria-hidden="true">
            <GuillocheSeal accent={theme.accent} accentDeep={theme.accentDeep} label="$" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-of-ink)" }}>No goals yet</div>
          <div style={{ fontSize: 13, color: "var(--color-of-muted)", maxWidth: 340 }}>
            Create a goal and your monthly savings will split across it automatically by priority.
          </div>
          <Button size="sm" onClick={() => onAdd?.()} className="mt-3">
            <Plus data-icon="inline-start" size={16} strokeWidth={2.2} />
            New goal
          </Button>
        </section>
      ) : (
        <section
          className="of-grid-2up"
          style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
        >
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} accent={accent} theme={theme} fmt0={fmt0} hasPool={hasPool} onEdit={onEdit} />
          ))}
        </section>
      )}

      <AllocateSavingsModal
        open={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        onAllocated={refreshData}
        goals={goals}
        assignable={assignable}
        currency={currency}
        theme={theme}
      />
    </Statement>
  );
}

function GoalCard({
  goal: g,
  accent,
  theme,
  fmt0,
  hasPool,
  onEdit,
}: {
  goal: GoalPlanItem;
  accent: string;
  theme: OtterfundTheme;
  fmt0: (n: number) => string;
  hasPool: boolean;
  onEdit?: (g: GoalView) => void;
}) {
  // Deadline pacing pill: funded / on track (accent), behind (clay), or none.
  const pill = g.done
    ? { label: "Funded", bg: theme.accentTint, fg: theme.accentDeep }
    : g.onTrack === true
      ? { label: "On track", bg: theme.accentTint, fg: theme.accentDeep }
      : g.onTrack === false
        ? { label: "Behind", bg: theme.clayTint, fg: theme.clay }
        : null;

  // The funding line — ties the goal to its monthly contribution + finish date.
  const funding = g.done ? (
    <span style={{ color: theme.accentDeep, fontWeight: 500 }}>Fully funded 🎉</span>
  ) : g.monthlyContribution > 0 ? (
    <span>
      Set aside <span className="of-num" style={{ color: theme.accentDeep, fontWeight: 500 }}>{fmt0(g.monthlyContribution)}</span>/mo
      {g.etaLabel && <> to finish by <span style={{ color: "var(--color-of-ink)" }}>{g.etaLabel}</span></>}
    </span>
  ) : hasPool ? (
    <span>Not funded this month. Raise its priority to allocate savings here.</span>
  ) : (
    <span>Set your income and plan in Settings to fund this goal.</span>
  );

  // Deadline · priority sub-line (deadline is optional).
  const meta = [g.deadline, `${priorityLabel(g.priority)} priority`].filter(Boolean).join(" · ");

  return (
    <Panel
      theme={theme}
      hover
      padding="20px 22px"
      role="button"
      tabIndex={0}
      aria-label={`Edit ${g.name}`}
      onClick={() => onEdit?.(g)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit?.(g);
        }
      }}
    >
      {/* header — ring · name + pacing pill · percent */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <ProgressRing value={g.pct} size={52} stroke={5} color={accent}>
          {g.emoji && <span style={{ fontSize: 22, lineHeight: 1 }}>{g.emoji}</span>}
        </ProgressRing>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {g.name}
            </span>
            {pill && (
              <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: pill.bg, color: pill.fg }}>
                {pill.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--color-of-muted)", marginTop: 3 }}>{meta}</div>
        </div>
        <div className="of-num" style={{ fontSize: 22, fontWeight: 500, color: theme.accentDeep, flexShrink: 0 }}>
          {g.pct}%
        </div>
      </div>

      {/* hairline divider */}
      <div style={{ height: 1, background: "var(--color-of-line)", margin: "16px 0" }} />

      {/* Saved · Target · To go */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--color-of-faint)" }}>Saved</div>
          <div className="of-num" style={{ fontSize: 16, marginTop: 3 }}>{fmt0(g.saved)}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--color-of-faint)" }}>Target</div>
          <div className="of-num" style={{ fontSize: 16, marginTop: 3 }}>{fmt0(g.target)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "var(--color-of-faint)" }}>{g.done ? "Done" : "To go"}</div>
          <div className="of-num" style={{ fontSize: 16, marginTop: 3, color: theme.accentDeep }}>
            {fmt0(g.done ? 0 : g.remaining)}
          </div>
        </div>
      </div>

      {/* funding line */}
      <div style={{ fontSize: 12.5, color: "var(--color-of-muted)", marginTop: 16 }}>{funding}</div>
    </Panel>
  );
}
