"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { AccountView } from "@/lib/types";
import { ACCOUNT_TYPES } from "@/lib/constants";
import {
  AccountForm,
  validateAccount,
  DEFAULT_ACCOUNT_COLOR,
  type AccountFormValues,
  type AccountFormErrors,
} from "@/components/dashboard/modals/account-form";

const TYPE_TO_API = (label: string) => label.toLowerCase().replace(" ", "-");
const API_TO_TYPE = (api: string) =>
  ACCOUNT_TYPES.find((t) => t.toLowerCase().replace(" ", "-") === api) || "Other";

interface EditAccountModalProps {
  open: boolean;
  account: AccountView | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditAccountModal({ open, account, onClose, onUpdated }: EditAccountModalProps) {
  const [values, setValues] = useState<AccountFormValues>({
    name: "",
    type: "Chequing",
    balance: "",
    number: "",
    gradient: DEFAULT_ACCOUNT_COLOR,
  });
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (account && open) {
      setValues({
        name: account.name,
        type: account.type ? API_TO_TYPE(account.type) : "Chequing",
        balance: String(account.balance),
        number: account.num || "",
        gradient: account.bg || DEFAULT_ACCOUNT_COLOR,
      });
      setErrors({});
      setFormError("");
      setConfirmDelete(false);
    }
  }, [account, open]);

  // Auto-reset the "Are you sure?" state after 4s if the user doesn't follow through.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const change = (patch: Partial<AccountFormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof AccountFormErrors];
      return next;
    });
  };

  const handleSave = () => {
    if (!account) return;
    const found = validateAccount(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setFormError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/accounts/${account.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            type: TYPE_TO_API(values.type),
            balance: Number(values.balance) || 0,
            number: values.number.trim() || null,
            gradient: values.gradient,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFormError(data.error || "Couldn't save your changes. Please try again.");
          return;
        }
        onClose();
        onUpdated();
      } catch {
        setFormError("Something went wrong. Please try again.");
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
        const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
        if (!res.ok) {
          setFormError("Couldn't delete the account.");
          return;
        }
        onClose();
        onUpdated();
      } catch {
        setFormError("Something went wrong. Please try again.");
      }
    });
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px] p-9">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-bk-ink)]">
            Edit account
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <AccountForm values={values} errors={errors} onChange={change} />
        </div>

        {formError && <p className="text-sm text-[var(--color-bk-clay)] font-medium mt-3">{formError}</p>}

        <div className="flex items-center gap-2.5 mt-7">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={confirmDelete ? "Confirm delete account" : "Delete account"}
            aria-pressed={confirmDelete}
            className={`h-11 rounded-full flex items-center justify-center shrink-0 min-w-0 cursor-pointer text-sm font-semibold text-white transition-[width,padding,gap,background-color] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] disabled:opacity-50 ${
              confirmDelete
                ? "w-[148px] gap-1.5 px-3 bg-[var(--color-bk-clay)] hover:bg-[oklch(58%_0.12_38)]"
                : "w-11 gap-0 px-0 bg-[oklch(60%_0.16_25)] hover:bg-[var(--color-bk-clay)]"
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
            className="ml-auto h-11 px-6 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-85 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
