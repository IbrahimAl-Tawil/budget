"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AccountForm,
  validateAccount,
  DEFAULT_ACCOUNT_COLOR,
  type AccountFormValues,
  type AccountFormErrors,
} from "@/components/dashboard/modals/account-form";

const EMPTY: AccountFormValues = {
  name: "",
  type: "Chequing",
  balance: "",
  number: "",
  gradient: DEFAULT_ACCOUNT_COLOR,
};

export function AddAccountModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [values, setValues] = useState<AccountFormValues>(EMPTY);
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const change = (patch: Partial<AccountFormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    // Clear a field's error as the user corrects it.
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof AccountFormErrors];
      return next;
    });
  };

  const handleSubmit = () => {
    const found = validateAccount(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setFormError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            type: values.type.toLowerCase().replace(" ", "-"),
            balance: Number(values.balance) || 0, // balance defaults to 0
            number: values.number.trim() || undefined,
            gradient: values.gradient,
          }),
        });
        if (!res.ok) {
          setFormError("Couldn't create the account. Please try again.");
          return;
        }
        setValues(EMPTY);
        setErrors({});
        onAdded();
      } catch {
        setFormError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px] p-9">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-bk-ink)]">
            Add account
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <AccountForm values={values} errors={errors} onChange={change} />
        </div>

        {formError && <p className="text-sm text-[var(--color-bk-clay)] font-medium mt-3">{formError}</p>}

        <div className="flex gap-3 mt-7">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-[var(--color-bk-line)] bg-transparent text-sm font-medium text-[var(--color-bk-muted)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-[2] h-11 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-85"
          >
            {isPending ? "Adding…" : "Add account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
