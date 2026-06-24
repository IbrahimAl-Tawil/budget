"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const ACCOUNT_TYPES = [
  "Chequing",
  "Savings",
  "TFSA",
  "RRSP",
  "FHSA",
  "Credit Card",
  "Investment",
  "Other",
];

export function AddAccountModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Chequing");
  const [balance, setBalance] = useState("");
  const [number, setNumber] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name || balance === "") {
      setError("Name and balance are required");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type: type.toLowerCase().replace(" ", "-"),
            balance: Number(balance),
            number: number || undefined,
          }),
        });
        if (!res.ok) {
          setError("Failed to create account");
          return;
        }
        setName("");
        setType("Chequing");
        setBalance("");
        setNumber("");
        onAdded();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] rounded-3xl p-8 max-w-[420px] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_32px_80px_oklch(16%_0.02_260/0.2),0_4px_16px_oklch(16%_0.02_260/0.08)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-[-0.02em]">Add Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Account Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TD Chequing"
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Type</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)] appearance-none"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-text" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Balance</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Account Number (optional)</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. ·· 4821"
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>
        </div>
        {error && <p className="text-sm text-terra font-medium mt-2">{error}</p>}
        <div className="flex gap-2.5 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 py-3 rounded-xl border-[1.5px] border-bulga-border bg-transparent text-sm font-medium text-muted-text">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="flex-[2] py-3 rounded-xl bg-bulga-text text-white text-sm font-semibold hover:opacity-85">
            {isPending ? "Adding..." : "Add Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
