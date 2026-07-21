"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/otterfund/form";
import { MerchantAvatar } from "@/components/otterfund/merchant-avatar";
import { ChevronDown, Check, RefreshCw } from "lucide-react";
import { SUBSCRIPTION_CYCLES } from "@/lib/constants";
import { gqlClient, errMessage } from "@/lib/graphql/client";

const CATEGORIES = /* GraphQL */ `query Categories { categories { name } }`;

// Only manual accounts can host a hand-entered transaction — synced accounts are
// bank-truth (balance from Plaid), so we pull the `synced` flag and filter.
// `domain`/`institution` drive the bank avatar shown beside the picker.
const TX_ACCOUNTS = /* GraphQL */ `query TxAccounts { accounts { id name synced domain institution } }`;

const CREATE_TRANSACTION = /* GraphQL */ `
  mutation CreateTransaction($input: TransactionCreateInput!) {
    createTransaction(input: $input) { ok }
  }
`;

interface AccountOption {
  id: string;
  name: string;
  synced?: boolean | null;
  domain?: string | null;
  institution?: string | null;
}

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
  /** Opens the add-account flow — used by the "no manual account yet" guard so
      the user can create one without leaving the flow. */
  onAddAccount?: () => void;
}

const EMPTY_FORM = {
  name: "",
  amount: "",
  accountId: "",
  category: "Groceries",
  type: "debit",
  date: new Date().toISOString().split("T")[0],
};

export function AddTransactionModal({
  open,
  onClose,
  onAdded,
  onAddAccount,
}: AddTransactionModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState<string[]>([]);
  // Manual accounts only. `null` = not loaded yet (so we don't flash the
  // "add an account first" guard before the query resolves).
  const [manualAccounts, setManualAccounts] = useState<AccountOption[] | null>(null);
  // "Recurring bill" toggle — tracks this on the Subscriptions page (mirrors the
  // edit-transaction modal). The Subscription type forces it on (a subscription
  // is always a recurring bill); an Expense may opt in. `cycle` is the cadence.
  const [isRecurring, setIsRecurring] = useState(false);
  const [cycle, setCycle] = useState("Monthly");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isSubscriptionType = form.type === "subscription";
  const recurring = isSubscriptionType || isRecurring;

  useEffect(() => {
    if (!open) return;
    gqlClient
      .request(CATEGORIES)
      .then(({ categories }) =>
        setCategories(categories.map((c: { name: string }) => c.name)),
      )
      .catch(() => {
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

    gqlClient
      .request<{ accounts: AccountOption[] }>(TX_ACCOUNTS)
      .then(({ accounts }) => setManualAccounts(accounts.filter((a) => !a.synced)))
      .catch(() => setManualAccounts([]));
  }, [open]);

  // Default the account to the first manual one once they load (and keep the
  // selection valid if it ever falls out of the list).
  useEffect(() => {
    if (!manualAccounts || manualAccounts.length === 0) return;
    setForm((f) =>
      f.accountId && manualAccounts.some((a) => a.id === f.accountId)
        ? f
        : { ...f, accountId: manualAccounts[0].id },
    );
  }, [manualAccounts]);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // Picking the Subscriptions category turns the recurring-bill toggle on by
  // default — a subscription is recurring by nature. It stays editable (the user
  // can switch it back off); we only auto-enable, never force it. Skipped for
  // Income, where the recurring section isn't shown.
  const setCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setForm((f) => ({ ...f, category }));
    if (category === "Subscriptions" && form.type !== "credit") setIsRecurring(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.amount) {
      setError("Please fill in all fields");
      return;
    }
    if (!form.accountId) {
      setError("Choose which account this comes out of.");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        await gqlClient.request(CREATE_TRANSACTION, {
          input: {
            name: form.name,
            amount: Number(form.amount),
            accountId: form.accountId,
            category: form.category,
            // A subscription is a form of bill — persisted as a debit like any
            // expense; the type only differs by the recurring tracking it turns on.
            type: form.type === "credit" ? "credit" : "debit",
            date: form.date,
            ...(recurring && { isRecurring: true, cycle }),
          },
        });

        setForm(EMPTY_FORM);
        setIsRecurring(false);
        setCycle("Monthly");
        onClose();
        onAdded?.();
      } catch (e) {
        setError(errMessage(e));
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

  // Loaded and there are no manual accounts to spend from — a transaction has to
  // come out of a manual account, so guide the user to make one first.
  const noManualAccounts = manualAccounts !== null && manualAccounts.length === 0;

  // Bank avatar for the chosen account (logo → letter fallback, as on Accounts).
  const selectedAccount = manualAccounts?.find((a) => a.id === form.accountId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 sm:p-9">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-[-0.02em] text-[var(--color-of-ink)]">
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        {noManualAccounts ? (
          <div className="mt-3 text-center">
            <p className="text-[15px] font-semibold text-[var(--color-of-ink)]">
              Add a manual account first
            </p>
            <p className="mx-auto mt-1.5 max-w-[340px] text-sm leading-relaxed text-[var(--color-of-muted)]">
              A transaction has to come out of a manual account, and you don&apos;t have
              one yet. Connected bank accounts sync their own transactions
              automatically. This is for money you track by hand.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => onAddAccount?.()}
                disabled={!onAddAccount}
                className="flex-[2]"
              >
                Add a manual account
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
                  Description
                </label>
                <input
                  placeholder="e.g. Tim Hortons"
                  value={form.name}
                  onChange={set("name")}
                  className="of-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={set("amount")}
                  className="of-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
                  Account
                </label>
                <div className="relative">
                  {selectedAccount && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                      <MerchantAvatar
                        name={selectedAccount.institution || selectedAccount.name}
                        domain={selectedAccount.domain}
                        bg="var(--color-of-line-soft)"
                        ink="var(--color-of-muted)"
                        size={22}
                        fit="contain"
                      />
                    </span>
                  )}
                  <select
                    value={form.accountId}
                    onChange={set("accountId")}
                    className={`of-field-select${selectedAccount ? " pl-11" : ""}`}
                    disabled={manualAccounts === null}
                  >
                    {manualAccounts === null ? (
                      <option>Loading accounts…</option>
                    ) : (
                      manualAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--color-of-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
                  Date
                </label>
                <DateInput value={form.date} onChange={set("date")} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={setCategory}
                    className="of-field-select"
                  >
                    {displayCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--color-of-muted)]" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
                  Type
                </label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={set("type")}
                    className="of-field-select"
                  >
                    <option value="debit">Expense</option>
                    <option value="credit">Income</option>
                    <option value="subscription">Subscription</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--color-of-muted)]" />
                </div>
              </div>

              {/* Recurring bill — tracks this on the Subscriptions page. Locked on
                  for the Subscription type (always a recurring bill); optional for
                  an Expense. Hidden for Income. The cadence picker appears once on. */}
              {form.type !== "credit" && (
                <div>
                  <button
                    type="button"
                    onClick={() => { if (!isSubscriptionType) setIsRecurring((v) => !v); }}
                    aria-pressed={recurring}
                    disabled={isSubscriptionType}
                    className="flex w-full items-start gap-3 rounded-xl border border-[var(--color-of-line)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--color-of-hover)] disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <span
                      className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors"
                      style={{
                        borderColor: recurring ? "var(--primary)" : "var(--color-of-line)",
                        background: recurring ? "var(--primary)" : "transparent",
                      }}
                    >
                      {recurring && (
                        <Check size={13} strokeWidth={3} className="text-[var(--primary-foreground)]" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-of-ink)]">
                        <RefreshCw size={13} strokeWidth={2.2} className="text-[var(--color-of-muted)]" />
                        Recurring bill
                      </span>
                      <span className="block text-[12.5px] text-[var(--color-of-muted)] mt-0.5">
                        {isSubscriptionType
                          ? "Subscriptions are always tracked as a recurring bill on your Subscriptions."
                          : "Track this as a recurring bill on your Subscriptions."}
                      </span>
                    </span>
                  </button>
                  {recurring && (
                    <div className="mt-3 pl-8">
                      <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
                        Billing cycle
                      </label>
                      <div className="relative">
                        <select
                          value={cycle}
                          onChange={(e) => setCycle(e.target.value)}
                          className="of-field-select"
                        >
                          {SUBSCRIPTION_CYCLES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--color-of-muted)]" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-[var(--color-of-clay)] font-medium mt-2">{error}</p>
            )}

            <div className="flex gap-3 mt-7">
              <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isPending} className="flex-[2]">
                {isPending ? "Adding..." : "Add Transaction"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
