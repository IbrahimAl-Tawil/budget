"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Unlink } from "lucide-react";
import type { AccountView } from "@/lib/types";
import { ACCOUNT_TYPES } from "@/lib/constants";
import {
  AccountForm,
  validateAccount,
  DEFAULT_ACCOUNT_COLOR,
  type AccountFormValues,
  type AccountFormErrors,
} from "@/components/dashboard/modals/account-form";
import { gqlClient, errMessage } from "@/lib/graphql/client";

const UPDATE_ACCOUNT = /* GraphQL */ `
  mutation UpdateAccount($id: ID!, $input: AccountUpdateInput!) {
    updateAccount(id: $id, input: $input) { ok }
  }
`;

const DELETE_ACCOUNT = /* GraphQL */ `
  mutation DeleteAccount($id: ID!) {
    deleteAccount(id: $id) { ok }
  }
`;

const UNLINK_PLAID_ITEM = /* GraphQL */ `
  mutation UnlinkPlaidItem($accountId: ID) {
    unlinkPlaidItem(accountId: $accountId) { ok }
  }
`;

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

  const synced = !!account?.synced;

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
        await gqlClient.request(UPDATE_ACCOUNT, {
          id: account.id,
          input: {
            name: values.name.trim(),
            type: TYPE_TO_API(values.type),
            // Never overwrite a synced account's anchor balance from the form.
            ...(synced ? {} : { balance: Number(values.balance) || 0 }),
            number: values.number.trim() || null,
            gradient: values.gradient,
          },
        });
        onClose();
        onUpdated();
      } catch (e) {
        setFormError(errMessage(e));
      }
    });
  };

  // Synced accounts disconnect the whole bank link (removes its accounts +
  // transactions). Manual accounts are simply deleted.
  const handleRemove = () => {
    if (!account) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      try {
        if (synced) {
          await gqlClient.request(UNLINK_PLAID_ITEM, { accountId: account.id });
        } else {
          await gqlClient.request(DELETE_ACCOUNT, { id: account.id });
        }
        onClose();
        onUpdated();
      } catch {
        setFormError(synced ? "Couldn't disconnect the account." : "Couldn't delete the account.");
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
          <AccountForm values={values} errors={errors} onChange={change} lockBalance={synced} />
        </div>

        {synced && (
          <div
            className="mt-4 rounded-xl p-3 text-[12.5px] leading-relaxed"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            Synced from {account.institution || "your bank"}. Balance and transactions
            update automatically — disconnect to manage this account manually.
          </div>
        )}

        {formError && <p className="text-sm text-[var(--color-bk-clay)] font-medium mt-3">{formError}</p>}

        <div className="flex items-center gap-2.5 mt-7">
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            aria-label={
              confirmDelete
                ? synced
                  ? "Confirm disconnect account"
                  : "Confirm delete account"
                : synced
                  ? "Disconnect account"
                  : "Delete account"
            }
            aria-pressed={confirmDelete}
            className={`h-11 rounded-full flex items-center justify-center shrink-0 min-w-0 cursor-pointer text-sm font-semibold text-white transition-[width,padding,gap,background-color] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] disabled:opacity-50 ${
              confirmDelete
                ? "w-[148px] gap-1.5 px-3 bg-[var(--color-bk-clay)] hover:bg-[oklch(58%_0.12_38)]"
                : "w-11 gap-0 px-0 bg-[oklch(60%_0.16_25)] hover:bg-[var(--color-bk-clay)]"
            }`}
          >
            {synced ? <Unlink className="w-4 h-4 shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0" />}
            <span
              className={`whitespace-nowrap overflow-hidden text-[13px] font-semibold transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                confirmDelete ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              {isPending ? (synced ? "Disconnecting…" : "Deleting…") : "Are you sure?"}
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
