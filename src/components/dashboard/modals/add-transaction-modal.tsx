"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export function AddTransactionModal({
  open,
  onClose,
  onAdded,
}: AddTransactionModalProps) {
  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "Groceries",
    type: "debit",
    date: new Date().toISOString().split("T")[0],
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/settings/categories")
        .then((r) => r.json())
        .then((data) => {
          if (data.categories) {
            setCategories(data.categories.map((c: { name: string }) => c.name));
          }
        })
        .catch(() => {
          // Fallback categories
          setCategories([
            "Groceries",
            "Dining Out",
            "Transport",
            "Bills",
            "Entertainment",
            "Health",
            "Subscriptions",
            "Income",
            "Other",
          ]);
        });
    }
  }, [open]);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name || !form.amount) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            amount: Number(form.amount),
            category: form.category,
            type: form.type,
            date: form.date,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to add transaction");
          return;
        }

        // Reset form and close
        setForm({
          name: "",
          amount: "",
          category: "Groceries",
          type: "debit",
          date: new Date().toISOString().split("T")[0],
        });
        onClose();
        onAdded?.();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  const displayCategories =
    categories.length > 0
      ? categories
      : [
          "Groceries",
          "Dining Out",
          "Transport",
          "Bills",
          "Entertainment",
          "Health",
          "Subscriptions",
          "Income",
          "Other",
        ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] rounded-3xl p-8 max-w-[420px] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_32px_80px_oklch(16%_0.02_260/0.2),0_4px_16px_oklch(16%_0.02_260/0.08)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-[-0.02em]">
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Description
            </label>
            <input
              placeholder="e.g. Tim Hortons"
              value={form.name}
              onChange={set("name")}
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Amount
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={set("amount")}
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Category
            </label>
            <div className="relative">
              <select
                value={form.category}
                onChange={set("category")}
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
              Type
            </label>
            <div className="relative">
              <select
                value={form.type}
                onChange={set("type")}
                className="w-full pl-4 pr-10 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)] appearance-none"
              >
                <option value="debit">Expense</option>
                <option value="credit">Income</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-text" />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-terra font-medium mt-2">{error}</p>
        )}

        <div className="flex gap-2.5 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-[1.5px] border-bulga-border bg-transparent font-sans text-sm font-medium text-muted-text hover:bg-[oklch(100%_0_0/0.1)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-[2] py-3 rounded-xl bg-bulga-text text-white font-sans text-sm font-semibold hover:opacity-85"
          >
            {isPending ? "Adding..." : "Add Transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
