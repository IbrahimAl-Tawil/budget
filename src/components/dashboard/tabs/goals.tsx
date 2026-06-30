"use client";

import { useEffect, useState, useTransition } from "react";
import type { GoalView, GoalAllocationView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard, CardLabel } from "@/components/dashboard/primitives/glass-card";
import { Plus } from "lucide-react";
import { AddGoalModal } from "@/components/dashboard/modals/add-goal-modal";
import { EditGoalModal } from "@/components/dashboard/modals/edit-goal-modal";

interface AllocationsResponse {
  surplus: number;
  allocations: GoalAllocationView[];
}

export function Goals({ data, onRefresh }: { data: GoalView[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<GoalView | null>(null);
  const [surplusData, setSurplusData] = useState<AllocationsResponse | null>(null);
  const [overrideAmounts, setOverrideAmounts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const loadAllocations = async () => {
    try {
      const res = await fetch("/api/goals/allocations");
      if (!res.ok) return;
      const json = (await res.json()) as AllocationsResponse;
      setSurplusData(json);
      const seed: Record<string, string> = {};
      for (const a of json.allocations) {
        seed[a.id] = a.amount.toFixed(2);
      }
      setOverrideAmounts(seed);
    } catch {
      // Surface failures lazily — surplus card will fall back to its empty state.
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const generatePlan = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/goals/allocations", { method: "POST" });
        if (!res.ok) {
          setError("Failed to generate plan");
          return;
        }
        await loadAllocations();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  const overrideAllocation = (allocationId: string, amount: number) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/goals/allocations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allocationId, amount }),
        });
        if (!res.ok) {
          setError("Failed to override");
          return;
        }
        await loadAllocations();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  const applyAll = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/goals/allocations", { method: "PUT" });
        if (!res.ok) {
          setError("Failed to apply");
          return;
        }
        await loadAllocations();
        onRefresh();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  const surplus = surplusData?.surplus ?? 0;
  const allocations = surplusData?.allocations ?? [];
  const allApplied =
    allocations.length > 0 && allocations.every((a) => a.status === "applied");
  const hasPending = allocations.some(
    (a) => a.status === "pending" || a.status === "overridden"
  );

  return (
    <div className="tab-content flex flex-col gap-10 sm:gap-14 w-full max-w-[1080px] mx-auto">
      {/* ── HERO · Surplus Allocation ────────────────────────────────── */}
      <GlassCard className="p-8 sm:p-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardLabel>Surplus Allocation</CardLabel>
            <div className="font-serif text-[clamp(2.5rem,6vw,3.25rem)] tracking-[-0.035em] leading-[0.92] tabular-nums">
              {fmt(Math.max(surplus, 0))}{" "}
              <span className="text-sm font-sans text-muted-text font-normal">
                this month
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {surplus > 0 && allocations.length === 0 && (
              <button
                type="button"
                onClick={generatePlan}
                disabled={isPending}
                className="h-10 px-4 rounded-full bg-bulga-text text-white text-sm font-semibold hover:opacity-85 disabled:opacity-50"
              >
                {isPending ? "Generating…" : "Generate Plan"}
              </button>
            )}
            {hasPending && (
              <button
                type="button"
                onClick={applyAll}
                disabled={isPending}
                className="h-10 px-4 rounded-full bg-sage text-white text-sm font-semibold hover:opacity-85 disabled:opacity-50"
              >
                {isPending ? "Applying…" : "Apply All"}
              </button>
            )}
          </div>
        </div>

        {surplus <= 0 && (
          <p className="text-sm text-muted-text mt-3">No surplus to allocate this month.</p>
        )}

        {surplus > 0 && allocations.length === 0 && (
          <p className="text-sm text-muted-text mt-3">
            Click <span className="font-semibold">Generate Plan</span> to split your surplus across goals by priority.
          </p>
        )}

        {allocations.length > 0 && (
          <div className="mt-6 space-y-2.5">
            {allocations.map((a) => {
              const isApplied = a.status === "applied";
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[oklch(100%_0_0/0.1)]"
                >
                  <span className="text-lg w-7 text-center">{a.goalEmoji || "🎯"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{a.goalName}</div>
                    <div className="text-[11px] text-muted-text">
                      {a.status === "pending" && "Pending"}
                      {a.status === "overridden" && "Overridden"}
                      {a.status === "applied" && "Applied"}
                    </div>
                  </div>
                  {isApplied ? (
                    <span className="text-[13px] font-bold text-sage tabular-nums">{fmt(a.amount)}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={overrideAmounts[a.id] ?? ""}
                        onChange={(e) =>
                          setOverrideAmounts((prev) => ({ ...prev, [a.id]: e.target.value }))
                        }
                        onBlur={() => {
                          const next = Number(overrideAmounts[a.id]);
                          if (!Number.isFinite(next) || Math.abs(next - a.amount) < 0.005) return;
                          overrideAllocation(a.id, next);
                        }}
                        className="w-24 px-2 py-1.5 rounded-lg border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-[13px] text-right text-bulga-text outline-none focus:border-sage tabular-nums"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {allApplied && (
              <p className="text-[12px] text-sage font-medium mt-2">
                All allocations applied for this month.
              </p>
            )}
            {error && <p className="text-sm text-terra font-medium mt-2">{error}</p>}
          </div>
        )}
      </GlassCard>

      {/* ── Goal cards + add · 2-up ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          const remaining = g.target - g.saved;
          const priorityLabel = g.priority > 0 ? `${Math.round(g.priority)}%` : "Equal split";
          return (
            <GlassCard
              key={g.id}
              onClick={() => setEditing(g)}
              className="cursor-pointer transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <CardLabel>Savings Goal</CardLabel>
                <span className="text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-[oklch(100%_0_0/0.18)] text-muted-text tabular-nums">
                  {priorityLabel}
                </span>
              </div>
              <div className="text-[24px] sm:text-[26px] font-serif mb-4 tracking-[-0.02em]">{g.emoji} {g.name}</div>
              <div className="flex items-center gap-6 mb-5">
                <svg width={100} height={100} viewBox="0 0 100 100" className="shrink-0">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(92% 0.01 80)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke={g.color} strokeWidth="10"
                    strokeDasharray={`${(pct / 100) * 251} ${251 - (pct / 100) * 251}`}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="44" textAnchor="middle" fontSize="18" fontFamily="var(--font-serif)" fill="oklch(16% 0.012 260)">{pct}%</text>
                  <text x="50" y="60" textAnchor="middle" fontSize="9" fontFamily="var(--font-sans)" fill="oklch(54% 0.014 260)">of goal</text>
                </svg>
                <div>
                  <div className="text-[11px] text-muted-text mb-1">Saved</div>
                  <div className="font-serif text-[26px] tracking-[-0.02em] tabular-nums" style={{ color: g.color }}>{fmt(g.saved)}</div>
                  <div className="text-[11px] text-muted-text mt-2">Remaining</div>
                  <div className="text-base font-bold tabular-nums">{fmt(remaining)}</div>
                </div>
              </div>
              <div className="h-2 bg-[oklch(100%_0_0/0.12)] rounded-full overflow-hidden mb-2.5">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.color }} />
              </div>
              <div className="flex justify-between text-[11px] text-muted-text">
                <span className="tabular-nums">Target: {fmt(g.target)}</span>
                <span>Deadline: {g.deadline}</span>
              </div>
            </GlassCard>
          );
        })}

        <GlassCard
          className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-bulga-border bg-[oklch(100%_0_0/0.06)] shadow-none cursor-pointer gap-3"
          onClick={() => setShowAdd(true)}
        >
          <div className="w-12 h-12 rounded-full bg-sage-light flex items-center justify-center">
            <Plus className="w-5 h-5 text-sage" />
          </div>
          <div className="text-sm font-semibold text-muted-text">Add a new goal</div>
        </GlassCard>
      </div>

      <AddGoalModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { setShowAdd(false); onRefresh(); loadAllocations(); }}
      />

      <EditGoalModal
        open={editing !== null}
        goal={editing}
        onClose={() => setEditing(null)}
        onUpdated={() => { setEditing(null); onRefresh(); loadAllocations(); }}
      />
    </div>
  );
}
