"use client";

import type { TransactionView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { TxIcon } from "./tx-icon";

interface TxRowProps {
  tx: TransactionView;
  currency?: string;
  onDoubleClick?: (tx: TransactionView) => void;
}

export function TxRow({ tx, currency = "CAD", onDoubleClick }: TxRowProps) {
  return (
    <div
      onDoubleClick={() => onDoubleClick?.(tx)}
      className={`flex items-center gap-3.5 px-3 py-[11px] rounded-xl transition-colors hover:bg-[oklch(100%_0_0/0.1)] ${onDoubleClick ? "cursor-pointer" : ""}`}
    >
      <div
        className="w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0"
        style={{ background: tx.color }}
      >
        <TxIcon icon={tx.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{tx.name}</div>
        <div className="text-[11px] text-muted-text mt-px">
          {tx.category} · {tx.date}
        </div>
      </div>
      <div
        className={`text-sm font-bold shrink-0 ${
          tx.amount > 0 ? "text-sage" : "text-bulga-text"
        }`}
      >
        {tx.amount > 0 ? "+" : "-"}
        {fmt(tx.amount, currency)}
      </div>
    </div>
  );
}
