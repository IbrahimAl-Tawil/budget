"use client";

import { useState } from "react";
import type { TransactionView, SpendCategory } from "@/lib/types";
import { fmt } from "@/lib/format";
import { GlassCard, CardLabel } from "./glass-card";
import { TxRow } from "./tx-row";
import { EditTransactionModal } from "./edit-tx-modal";
import { Search, Upload } from "lucide-react";

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
    <div className="tab-content grid grid-cols-[1.5fr_1fr] gap-3.5">
      <GlassCard>
        <div className="flex justify-between items-center mb-4">
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
        <div className="overflow-y-auto max-h-[calc(100vh-260px)] custom-scrollbar">
          <div className="flex flex-col gap-0.5">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} onDoubleClick={setEditTx} />
              ))
            ) : (
              <p className="text-sm text-muted-text text-center py-8">No transactions found</p>
            )}
          </div>
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

      <div className="flex flex-col gap-3.5">
        <GlassCard>
          <CardLabel>This Month</CardLabel>
          <div className="flex gap-4 mt-1">
            <div>
              <div className="text-[11px] text-muted-text">Income</div>
              <div className="font-serif text-[22px] text-sage tracking-[-0.02em]">+{fmt(income)}</div>
            </div>
            <div className="w-px bg-bulga-border" />
            <div>
              <div className="text-[11px] text-muted-text">Spent</div>
              <div className="font-serif text-[22px] tracking-[-0.02em]">-{fmt(spent)}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="flex-1">
          <CardLabel>By Category</CardLabel>
          {spending.length > 0 ? (
            spending.slice(0, 6).map((c) => (
              <div key={c.name} className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-[13px]">
                  <div className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: c.color }} />
                  <span>{c.name}</span>
                </div>
                <span className="text-[13px] font-semibold">{fmt(c.amount)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-text mt-2">No data</p>
          )}
        </GlassCard>
      </div>

      <EditTransactionModal
        open={!!editTx}
        transaction={editTx}
        onClose={() => setEditTx(null)}
        onUpdated={onRefresh}
      />
    </div>
  );
}
