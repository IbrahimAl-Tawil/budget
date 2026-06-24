"use client";

import { useState } from "react";
import type { AccountView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard } from "./glass-card";
import { Plus, Pencil } from "lucide-react";
import { AddAccountModal } from "./add-account-modal";
import { EditAccountModal } from "./edit-account-modal";

export function Accounts({ data, onRefresh }: { data: AccountView[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AccountView | null>(null);

  return (
    <div className="tab-content grid grid-cols-3 gap-3.5">
      {data.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => setEditing(a)}
          className="group relative text-left rounded-[20px] p-6 text-white transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1 hover:shadow-[0_12px_48px_oklch(16%_0.02_260/0.1),0_4px_12px_oklch(16%_0.02_260/0.05)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-bulga-bg"
          style={{ background: a.bg }}
          aria-label={`Edit ${a.name}`}
        >
          <span className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[oklch(100%_0_0/0.18)] backdrop-blur-[12px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-3.5 h-3.5" />
          </span>
          <div className="text-[13px] font-semibold opacity-80">{a.name}</div>
          {a.num && <div className="text-[11px] opacity-60 mb-5">{a.num}</div>}
          {!a.num && <div className="mb-5" />}
          <div className="font-serif text-[28px] tracking-[-0.03em]">
            {a.balance < 0 ? "-" : ""}{fmt(a.balance)}
          </div>
          {a.change && <div className="text-[11px] mt-1.5 opacity-70">{a.change}</div>}
        </button>
      ))}

      {/* Add account card */}
      <GlassCard
        className="flex items-center justify-center flex-col gap-2.5 bg-[oklch(100%_0_0/0.06)] border-2 border-dashed border-bulga-border shadow-none cursor-pointer min-h-[140px]"
        onClick={() => setShowAdd(true)}
      >
        <Plus className="w-6 h-6 text-muted-text" />
        <div className="text-[13px] font-semibold text-muted-text">Add an account</div>
      </GlassCard>

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
