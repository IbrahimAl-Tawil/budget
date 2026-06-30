"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";
import type { TransactionView } from "@/lib/types";

interface EditTransactionModalProps {
  open: boolean;
  transaction: TransactionView | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditTransactionModal({
  open,
  transaction,
  onClose,
  onUpdated,
}: EditTransactionModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (transaction && open) {
      setName(transaction.name);
      setAmount(String(Math.abs(transaction.amount)));
      setType(transaction.amount >= 0 ? "credit" : "debit");
      setCategory(transaction.category);
      // Parse the display date back — we need the ISO date from the API
      setDate("");
      setError("");

      fetch("/api/settings/categories")
        .then((r) => r.json())
        .then((data) => {
          if (data.categories) {
            setCategories(data.categories.map((c: { name: string }) => c.name));
          }
        })
        .catch(() => {});
    }
  }, [transaction, open]);

  const handleSave = () => {
    if (!transaction) return;
    setError("");
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          name,
          amount: Number(amount),
          type,
          category,
        };
        if (date) body.date = date;

        const res = await fetch(`/api/transactions/${transaction.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to update");
          return;
        }

        onClose();
        onUpdated();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  const handleDelete = () => {
    if (!transaction) return;
    if (!confirm("Delete this transaction?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/transactions/${transaction.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setError("Failed to delete");
          return;
        }
        onClose();
        onUpdated();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  if (!transaction) return null;

  const displayCategories =
    categories.length > 0
      ? categories
      : ["Groceries", "Dining Out", "Transport", "Bills", "Entertainment", "Health", "Subscriptions", "Income", "Other"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] rounded-3xl p-8 max-w-[420px] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_32px_80px_oklch(16%_0.02_260/0.2),0_4px_16px_oklch(16%_0.02_260/0.08)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-[-0.02em]">
            Edit Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Description
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
                Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "debit" | "credit")}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)] appearance-none"
                >
                  <option value="debit">Expense</option>
                  <option value="credit">Income</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-text" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)] appearance-none"
              >
                {displayCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-text" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Date (leave blank to keep current)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-terra font-medium mt-2">{error}</p>
        )}

        <div className="flex gap-2.5 mt-6">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="h-10 px-3 rounded-xl text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-[1.5px] border-bulga-border bg-transparent font-sans text-sm font-medium text-muted-text"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="flex-[2] py-3 rounded-xl bg-bulga-text text-white font-sans text-sm font-semibold hover:opacity-85"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
