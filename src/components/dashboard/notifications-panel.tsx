"use client";

import type { SpendCategory, BillView } from "@/lib/types";
import { fmt } from "@/lib/format";
import { AlertTriangle, TrendingUp, Calendar } from "lucide-react";

interface NotificationsPanelProps {
  budgetTarget: number;
  monthlySpend: number;
  spendingByCategory: SpendCategory[];
  upcomingBills: BillView[];
  onClose: () => void;
}

interface Notification {
  type: "warning" | "alert" | "info";
  title: string;
  message: string;
}

export function NotificationsPanel({
  budgetTarget,
  monthlySpend,
  spendingByCategory,
  upcomingBills,
  onClose,
}: NotificationsPanelProps) {
  const notifications: Notification[] = [];

  // Budget warnings
  if (budgetTarget > 0) {
    const pct = (monthlySpend / budgetTarget) * 100;
    if (pct > 100) {
      notifications.push({
        type: "alert",
        title: "Budget Exceeded",
        message: `You've spent ${fmt(monthlySpend)} of your ${fmt(budgetTarget)} budget (${Math.round(pct)}%).`,
      });
    } else if (pct > 80) {
      notifications.push({
        type: "warning",
        title: "Approaching Budget",
        message: `You've used ${Math.round(pct)}% of your monthly budget. ${fmt(budgetTarget - monthlySpend)} remaining.`,
      });
    }
  }

  // Category-level warnings
  for (const cat of spendingByCategory) {
    if (cat.budget > 0 && cat.amount > cat.budget) {
      notifications.push({
        type: "warning",
        title: `${cat.name} Over Budget`,
        message: `Spent ${fmt(cat.amount)} of ${fmt(cat.budget)} budget.`,
      });
    }
  }

  // Upcoming bills
  for (const bill of upcomingBills) {
    if (bill.urgent) {
      notifications.push({
        type: "info",
        title: `Bill Due Soon`,
        message: `${bill.name}: ${fmt(bill.amount)} due ${bill.due}.`,
      });
    }
  }

  if (notifications.length === 0) {
    notifications.push({
      type: "info",
      title: "All Good!",
      message: "No alerts right now. Your finances are on track.",
    });
  }

  const iconMap = {
    warning: <TrendingUp className="w-4 h-4 text-terra" />,
    alert: <AlertTriangle className="w-4 h-4 text-terra" />,
    info: <Calendar className="w-4 h-4 text-sage" />,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-2 w-[320px] bg-glass backdrop-blur-[40px] backdrop-saturate-[1.8] border border-bulga-border rounded-2xl shadow-[0_24px_80px_oklch(16%_0.02_260/0.14),0_0_1px_oklch(100%_0_0/0.15)_inset] z-50 overflow-hidden">
        <div className="px-4 py-3 border-b border-bulga-border">
          <span className="text-xs font-semibold tracking-[0.06em] uppercase text-muted-text">
            Notifications
          </span>
        </div>
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          {notifications.map((n, i) => (
            <div
              key={i}
              className="flex gap-3 px-4 py-3 border-b border-[oklch(100%_0_0/0.1)] last:border-b-0 hover:bg-[oklch(100%_0_0/0.08)]"
            >
              <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
              <div>
                <div className="text-[13px] font-semibold">{n.title}</div>
                <div className="text-[11px] text-muted-text mt-0.5">{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
