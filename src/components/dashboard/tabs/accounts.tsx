"use client";

import { useState } from "react";
import type { AccountView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard } from "@/components/dashboard/primitives/glass-card";
import { Plus, Pencil } from "lucide-react";
import { AddAccountModal } from "@/components/dashboard/modals/add-account-modal";
import { EditAccountModal } from "@/components/dashboard/modals/edit-account-modal";

const ovLabelCls = "text-[11px] font-medium tracking-[0.07em] uppercase text-muted-text";

export function Accounts({ data, onRefresh }: { data: AccountView[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AccountView | null>(null);

  const totalBalance = data.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="tab-content flex flex-col gap-10 sm:gap-14 w-full max-w-[1080px] mx-auto">
      {/* ── HERO · Total Balance ─────────────────────────────────────── */}
      <GlassCard className="p-8 sm:p-12">
        <div className={ovLabelCls}>Total Balance</div>
        <div className="font-serif text-[clamp(3.25rem,9vw,5rem)] tracking-[-0.035em] leading-[0.92] mt-4 tabular-nums">
          {totalBalance < 0 ? "-" : ""}
          {fmt(Math.abs(totalBalance))}
        </div>
        <div className="text-[13px] text-muted-text mt-3">
          Across {data.length} account{data.length === 1 ? "" : "s"}
        </div>
      </GlassCard>

      {/* ── Account cards · 2-up ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setEditing(a)}
            className="group relative text-left rounded-[22px] p-7 sm:p-8 min-h-[156px] text-white transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1 hover:shadow-[0_12px_48px_oklch(16%_0.02_260/0.1),0_4px_12px_oklch(16%_0.02_260/0.05)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-bulga-bg"
            style={{ background: a.bg }}
            aria-label={`Edit ${a.name}`}
          >
            <span className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[oklch(100%_0_0/0.18)] backdrop-blur-[12px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-3.5 h-3.5" />
            </span>
            <div className="text-[13px] font-semibold opacity-80">{a.name}</div>
            {a.num && <div className="text-[11px] opacity-60 mb-5">{a.num}</div>}
            {!a.num && <div className="mb-5" />}
            <div className="font-serif text-[30px] sm:text-[34px] tracking-[-0.03em] leading-none tabular-nums">
              {a.balance < 0 ? "-" : ""}{fmt(a.balance)}
            </div>
            {a.change && <div className="text-[11px] mt-1.5 opacity-70">{a.change}</div>}
          </button>
        ))}

        {/* Add account card */}
        <GlassCard
          className="flex items-center justify-center flex-col gap-2.5 bg-[oklch(100%_0_0/0.06)] border-2 border-dashed border-bulga-border shadow-none cursor-pointer min-h-[156px]"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-6 h-6 text-muted-text" />
          <div className="text-[13px] font-semibold text-muted-text">Add an account</div>
        </GlassCard>
      </div>

      <AddAccountModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { setShowAdd(false); onRefresh(); }}
      />

      <EditAccountModal
        open={!!editing}
        account={editing}
        onClose={() => setEditing(null)}
        onUpdated={() => { setEditing(null); onRefresh(); }}
      />
    </div>
  );
}
