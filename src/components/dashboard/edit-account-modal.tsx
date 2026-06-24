"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, Check } from "lucide-react";
import type { AccountView } from "@/lib/types";

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

const ACCOUNT_COLORS: { name: string; value: string }[] = [
  { name: "Charcoal", value: "linear-gradient(135deg, oklch(18% 0.012 260), oklch(28% 0.015 260))" },
  { name: "Sage", value: "linear-gradient(135deg, oklch(52% 0.08 155), oklch(62% 0.09 170))" },
  { name: "Slate", value: "linear-gradient(135deg, oklch(44% 0.07 245), oklch(56% 0.08 255))" },
  { name: "Plum", value: "linear-gradient(135deg, oklch(60% 0.07 290), oklch(52% 0.09 280))" },
  { name: "Sky", value: "linear-gradient(135deg, oklch(58% 0.09 210), oklch(50% 0.08 220))" },
  { name: "Terra", value: "linear-gradient(135deg, oklch(55% 0.09 38), oklch(65% 0.1 50))" },
  { name: "Sand", value: "linear-gradient(135deg, oklch(60% 0.05 80), oklch(50% 0.05 80))" },
];

const TYPE_TO_API = (label: string) => label.toLowerCase().replace(" ", "-");
const API_TO_TYPE = (api: string) =>
  ACCOUNT_TYPES.find((t) => t.toLowerCase().replace(" ", "-") === api) || "Other";

interface EditAccountModalProps {
  open: boolean;
  account: AccountView | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditAccountModal({
  open,
  account,
  onClose,
  onUpdated,
}: EditAccountModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Chequing");
  const [balance, setBalance] = useState("");
  const [number, setNumber] = useState("");
  const [gradient, setGradient] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (account && open) {
      setName(account.name);
      setBalance(String(account.balance));
      setNumber(account.num || "");
      setGradient(account.bg);
      setType(account.type ? API_TO_TYPE(account.type) : "Chequing");
      setError("");
      setConfirmDelete(false);
    }
  }, [account, open]);

  // Auto-reset the "Are you sure?" state after 4s if the user doesn't follow through.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleSave = () => {
    if (!account) return;
    if (!name || balance === "") {
      setError("Name and balance are required");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/accounts/${account.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type: TYPE_TO_API(type),
            balance: Number(balance),
            number: number || null,
            gradient,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to update account");
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
    if (!account) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/accounts/${account.id}`, {
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

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] rounded-3xl p-8 max-w-[420px] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_32px_80px_oklch(16%_0.02_260/0.2),0_4px_16px_oklch(16%_0.02_260/0.08)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-[-0.02em]">
            Edit Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Name
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
                Balance
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
                Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)] appearance-none"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-text" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Account Number (optional)
            </label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. ·· 4821"
              className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((c) => {
                const selected = c.value === gradient;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setGradient(c.value)}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={selected}
                    className={`relative w-9 h-9 rounded-full transition-transform duration-200 cursor-pointer ${
                      selected
                        ? "scale-110 ring-2 ring-sage ring-offset-2 ring-offset-[oklch(100%_0_0/0.62)]"
                        : "hover:scale-110"
                    }`}
                    style={{ background: c.value }}
                  >
                    {selected && (
                      <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-[0_1px_2px_oklch(0%_0_0/0.4)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-xl p-4 text-white"
            style={{ background: gradient }}
            aria-hidden
          >
            <div className="text-[12px] font-semibold opacity-80">{name || "Account name"}</div>
            <div className="font-serif text-[22px] tracking-[-0.03em] mt-1">
              {balance ? `$${Number(balance).toLocaleString("en-CA", { minimumFractionDigits: 2 })}` : "$0.00"}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-terra font-medium mt-2">{error}</p>}

        <div className="flex items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={confirmDelete ? "Confirm delete account" : "Delete account"}
            aria-pressed={confirmDelete}
            className={`h-11 rounded-xl flex items-center justify-center shrink-0 min-w-0 cursor-pointer text-sm font-semibold text-white transition-[width,padding,gap,background-color] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] disabled:opacity-50 ${
              confirmDelete
                ? "w-[148px] gap-1.5 px-3 bg-terra hover:bg-[oklch(58%_0.12_38)]"
                : "w-11 gap-0 px-0 bg-[oklch(60%_0.16_25)] hover:bg-terra"
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden text-[13px] font-semibold transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                confirmDelete ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              {isPending ? "Deleting…" : "Are you sure?"}
            </span>
          </button>
          <Button
            onClick={handleSave}
            disabled={isPending || confirmDelete}
            className="ml-auto h-11 px-6 rounded-xl bg-bulga-text text-white font-sans text-sm font-semibold hover:opacity-85 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
