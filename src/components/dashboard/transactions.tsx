"use client";

import { useState } from "react";
import type { TransactionView, SpendCategory } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard, CardLabel } from "./glass-card";
import { TxRow } from "./tx-row";
import { EditTransactionModal } from "./edit-tx-modal";
import { Search, Upload } from "lucide-react";

const STAT_DIVIDER = "oklch(90% 0.006 80)";
const TX_DIVIDER = "oklch(94% 0.004 80)";
const ovLabelCls = "text-[11px] font-medium tracking-[0.07em] uppercase text-muted-text";

interface TransactionsProps {
  data: { transactions: TransactionView[]; total: number; totalPages: number };
  spending: SpendCategory[];
  onImport: () => void;
  onRefresh: () => void;
  month: number;
  year: number;
}

export function Transactions({ data, spending, onImport, onRefresh, month, year }: TransactionsProps) {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState(data.transactions);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(data.totalPages);
  const [total, setTotal] = useState(data.total);
  const [editTx, setEditTx] = useState<TransactionView | null>(null);

  const doSearch = async (query: string, p = 1) => {
    setSearch(query);
    const params = new URLSearchParams({
      tab: "transactions", month: String(month), year: String(year),
      search: query, page: String(p),
    });
    const res = await fetch(`/api/dashboard?${params}`);
    if (!res.ok) return;
    const result = await res.json();
    setTransactions(result.transactions);
    setPage(p);
    setTotalPages(result.totalPages);
    setTotal(result.total);
  };

  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const spent = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
  );

  return (
    <div className="tab-content flex flex-col gap-10 sm:gap-14 w-full max-w-[1080px] mx-auto">
      {/* ── This Month + By Category · summary band ──────────────────── */}
      <GlassCard className="p-8 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className={ovLabelCls}>This Month</div>
            <div className="flex items-baseline gap-6 sm:gap-8 mt-4">
              <div>
                <div className="text-[11px] text-muted-text mb-1.5">Income</div>
                <div className="font-serif text-[30px] sm:text-[34px] tracking-[-0.03em] leading-none text-sage tabular-nums">
                  +{fmt(income)}
                </div>
              </div>
              <div className="w-px h-11 self-center" style={{ background: STAT_DIVIDER }} />
              <div>
                <div className="text-[11px] text-muted-text mb-1.5">Spent</div>
                <div className="font-serif text-[30px] sm:text-[34px] tracking-[-0.03em] leading-none tabular-nums">
                  -{fmt(spent)}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:border-l lg:pl-6" style={{ borderColor: STAT_DIVIDER }}>
            <div className={ovLabelCls}>By Category</div>
            <div className="mt-4">
              {spending.length > 0 ? (
                spending.slice(0, 6).map((c) => (
                  <div key={c.name} className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-[13px]">
                      <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: c.color }} />
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums">{fmt(c.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-text">No data</p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── All Transactions · wide ledger ───────────────────────────── */}
      <GlassCard>
        <div className="flex justify-between items-center mb-5 gap-3 flex-wrap">
          <CardLabel>All Transactions ({total})</CardLabel>
          <div className="flex items-center gap-2">
            <button
              onClick={onImport}
              className="flex items-center gap-1.5 text-xs text-sage font-semibold px-3 py-1.5 rounded-full border border-sage bg-sage-light hover:opacity-80 transition-opacity"
            >
              <Upload className="w-3 h-3" /> Import
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text" />
              <input
                value={search}
                onChange={(e) => doSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3.5 py-1.5 rounded-full border-[1.5px] border-bulga-border bg-glass text-[13px] font-sans outline-none w-[180px] focus:border-sage transition-colors"
              />
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[480px] custom-scrollbar -mx-3">
          {transactions.length > 0 ? (
            transactions.map((tx, i, arr) => (
              <div
                key={tx.id}
                style={{
                  borderBottom: i < arr.length - 1 ? `1px solid ${TX_DIVIDER}` : "none",
                }}
              >
                <TxRow tx={tx} onDoubleClick={setEditTx} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-text text-center py-8">No transactions found</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => doSearch(search, page - 1)}
              disabled={page <= 1}
              className="text-xs px-3 py-1 rounded-full border border-bulga-border disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-xs text-muted-text py-1">
              {page} of {totalPages}
            </span>
            <button
              onClick={() => doSearch(search, page + 1)}
              disabled={page >= totalPages}
              className="text-xs px-3 py-1 rounded-full border border-bulga-border disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </GlassCard>

      <EditTransactionModal
        open={!!editTx}
        transaction={editTx}
        onClose={() => setEditTx(null)}
        onUpdated={onRefresh}
      />
    </div>
  );
}
