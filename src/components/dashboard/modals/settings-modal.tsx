"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, type TabItem } from "@/components/bulga/tabs";
import { SchemePicker } from "@/components/bulga/scheme-picker";
import { useBulgaChrome } from "@/components/bulga/chrome-context";
import { createClient } from "@/lib/supabase/client";
import { gqlClient } from "@/lib/graphql/client";
import { User, Wallet, ShieldAlert, Download, ChevronDown, Database, Palette, Trash2, Check, Landmark, Unlink, RefreshCw, Loader2, Plus } from "lucide-react";
import { CURRENCIES } from "@/lib/constants";

const PLAID_ITEMS = /* GraphQL */ `
  query PlaidItems {
    plaidItems {
      itemId
      institutionName
      status
      lastSyncedAt
      accountCount
    }
  }
`;

const UNLINK_PLAID_ITEM = /* GraphQL */ `
  mutation UnlinkPlaidItem($itemId: ID) {
    unlinkPlaidItem(itemId: $itemId) { ok }
  }
`;

const UPDATE_SETTINGS = /* GraphQL */ `
  mutation UpdateSettings($input: SettingsUpdateInput!) {
    updateSettings(input: $input) { ok }
  }
`;

const DELETE_MY_ACCOUNT = /* GraphQL */ `
  mutation DeleteMyAccount {
    deleteMyAccount { ok }
  }
`;

type SettingsTab = "profile" | "money" | "connections" | "appearance" | "data";

const TABS: TabItem[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "appearance", label: "Appearance", icon: Palette },
  { value: "money", label: "Money", icon: Wallet },
  { value: "connections", label: "Connections", icon: Landmark },
  { value: "data", label: "Data", icon: Database },
];

interface PlaidConnection {
  itemId: string;
  institutionName: string | null;
  status: string;
  lastSyncedAt: string | null;
  accountCount: number;
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    monthlyIncome: number;
    currency: string;
    budgetTarget: number;
  };
  /** Active accent + setter — the Appearance tab hosts the theme picker. */
  accent: string;
  onAccentChange: (accent: string) => void;
  onSaved?: () => void;
}

const fieldLabelCls =
  "block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-bk-faint)] mb-1.5";

function SectionHead({
  icon: Icon,
  title,
  desc,
  tone = "accent",
}: {
  icon: typeof User;
  title: string;
  desc: string;
  tone?: "accent" | "clay";
}) {
  const tint = tone === "clay" ? "var(--color-bk-clay-tint)" : "var(--accent)";
  const ink = tone === "clay" ? "var(--color-bk-clay)" : "var(--color-primary)";
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: tint, color: ink }}
      >
        <Icon className="w-[17px] h-[17px]" strokeWidth={1.9} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-bk-ink)] leading-tight">
          {title}
        </h3>
        <p className="text-[12.5px] text-[var(--color-bk-muted)] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose, user, accent, onAccentChange, onSaved }: SettingsModalProps) {
  const router = useRouter();
  const { connectBank } = useBulgaChrome();
  const [tab, setTab] = useState<SettingsTab>("profile");

  // ── Connections (linked banks) ──
  const [connections, setConnections] = useState<PlaidConnection[] | null>(null);
  const [connLoading, setConnLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setConnLoading(true);
    try {
      const { plaidItems } = await gqlClient.request<{ plaidItems: PlaidConnection[] }>(
        PLAID_ITEMS,
      );
      setConnections(plaidItems ?? []);
    } catch {
      setConnections([]);
    } finally {
      setConnLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && tab === "connections") loadConnections();
  }, [open, tab, loadConnections]);

  const disconnect = async (itemId: string) => {
    setDisconnecting(itemId);
    try {
      await gqlClient.request(UNLINK_PLAID_ITEM, { itemId });
      await loadConnections();
      router.refresh();
    } finally {
      setDisconnecting(null);
    }
  };

  // Connecting/reconnecting opens the Plaid overlay, so close settings first.
  const startConnect = (updateItemId?: string) => {
    onClose();
    connectBank(updateItemId);
  };

  const [name, setName] = useState(user.name);
  const [monthlyIncome, setMonthlyIncome] = useState(String(user.monthlyIncome));
  const [currency, setCurrency] = useState(user.currency);
  const [budgetTarget, setBudgetTarget] = useState(String(user.budgetTarget));

  // Inline autosave status: fields persist ~800ms after the last edit, so there
  // is no Save button. `nameError` is the only blocking validation (name is
  // required) — it suppresses the save until the field is valid again.
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [nameError, setNameError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed the form ONCE per open. The values come from the server `user` props,
  // which resolve after first render, so we seed when the modal opens rather
  // than capturing in useState. Crucially this must NOT re-run on every prop
  // change: autosave calls router.refresh(), which feeds fresh `user` props
  // back in — re-seeding then would wipe the live "Saved" status (the flicker)
  // and clobber whatever the user is mid-typing. A ref gates it to the
  // open→close→open transition only.
  const seededRef = useRef(false);
  useEffect(() => {
    if (open && !seededRef.current) {
      seededRef.current = true;
      setName(user.name);
      setMonthlyIncome(String(user.monthlyIncome));
      setCurrency(user.currency);
      setBudgetTarget(String(user.budgetTarget));
      setSaveStatus("idle");
      setNameError("");
    } else if (!open && seededRef.current) {
      seededRef.current = false;
    }
  }, [open, user.name, user.monthlyIncome, user.currency, user.budgetTarget]);

  // Cancel any pending autosave when the modal unmounts.
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Let the "Saved" confirmation fade back to idle after a couple seconds.
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2200);
    return () => clearTimeout(t);
  }, [saveStatus]);

  // Delete account is a guarded inline confirm: clicking arms "Are you sure?",
  // which reveals a field the user must type the exact phrase into before the
  // destructive action unlocks.
  const DELETE_PHRASE = "Confirm delete";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteUnlocked = confirmText.trim() === DELETE_PHRASE;

  const disarmDelete = () => {
    setConfirmDelete(false);
    setConfirmText("");
  };

  // Arm on first click; clear the typed phrase as we re-arm.
  const armDelete = () => {
    setConfirmText("");
    setConfirmDelete(true);
  };

  const handleDeleteAccount = () => {
    if (!deleteUnlocked) return;
    setDeleting(true);
    gqlClient
      .request(DELETE_MY_ACCOUNT)
      .then(async () => {
        await createClient().auth.signOut();
        window.location.href = "/login";
      })
      .catch(() => setDeleting(false));
  };

  // Persist the current field values. Returns once the PATCH settles so the
  // status line can reflect the outcome. Refreshes the session only when the
  // name changed (the avatar/topbar read from the session, not the DB).
  const persist = async (values: { name: string; monthlyIncome: string; currency: string; budgetTarget: string }) => {
    const trimmedName = values.name.trim();
    setSaveStatus("saving");
    try {
      await gqlClient.request(UPDATE_SETTINGS, {
        input: {
          name: trimmedName,
          monthlyIncome: Number(values.monthlyIncome) || 0,
          currency: values.currency,
          budgetTarget: Number(values.budgetTarget) || 0,
        },
      });
      setSaveStatus("saved");
      router.refresh();
      onSaved?.();
    } catch {
      setSaveStatus("error");
    }
  };

  // Debounce: ~800ms after the last edit, persist — unless the name is blank
  // (the one blocking rule), in which case we surface the error and hold off.
  const scheduleSave = (next: { name: string; monthlyIncome: string; currency: string; budgetTarget: string }) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!next.name.trim()) {
      setNameError("Give yourself a name.");
      setSaveStatus("idle");
      return;
    }
    setNameError("");
    debounceRef.current = setTimeout(() => persist(next), 800);
  };

  const editName = (v: string) => { setName(v); scheduleSave({ name: v, monthlyIncome, currency, budgetTarget }); };
  const editIncome = (v: string) => { setMonthlyIncome(v); scheduleSave({ name, monthlyIncome: v, currency, budgetTarget }); };
  const editCurrency = (v: string) => { setCurrency(v); scheduleSave({ name, monthlyIncome, currency: v, budgetTarget }); };
  const editBudget = (v: string) => { setBudgetTarget(v); scheduleSave({ name, monthlyIncome, currency, budgetTarget: v }); };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          disarmDelete();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[760px] p-9 min-h-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[22px]">Settings</DialogTitle>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-8 md:flex-row md:gap-9">
          {/* ── Left rail: tabs ── */}
          <div className="md:w-[164px] md:shrink-0 md:border-r md:border-[var(--color-bk-line-soft)] md:pr-5">
            <Tabs
              items={TABS}
              value={tab}
              accent={accent}
              onValueChange={(v) => {
                disarmDelete();
                setTab(v as SettingsTab);
              }}
            />
          </div>

          {/* ── Right: active panel — content reads top-down; fixed dialog
               height keeps the footprint stable across tabs. ── */}
          <div className="min-h-[360px] flex-1">
            {tab === "profile" && (
              <section className="bk-enter">
                <SectionHead icon={User} title="Profile" desc="How you show up across Bulga." />
                <div className="flex max-w-[420px] flex-col gap-5">
                  <div>
                    <label className={fieldLabelCls}>Name</label>
                    <input
                      value={name}
                      onChange={(e) => editName(e.target.value)}
                      aria-invalid={!!nameError || undefined}
                      className={`bk-field ${nameError ? "border-[var(--color-bk-clay)] focus:border-[var(--color-bk-clay)]" : ""}`}
                    />
                    {nameError && (
                      <p className="mt-1.5 text-[12px] font-medium text-[var(--color-bk-clay)]">{nameError}</p>
                    )}
                  </div>
                  <div>
                    <label className={fieldLabelCls}>Email</label>
                    <input value={user.email} disabled className="bk-field opacity-60" />
                  </div>
                </div>
              </section>
            )}

            {tab === "money" && (
              <section className="bk-enter">
                <SectionHead icon={Wallet} title="Money" desc="Drives net worth, budget, and savings rate." />
                <div className="flex max-w-[420px] flex-col gap-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={fieldLabelCls}>Monthly income</label>
                      <input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => editIncome(e.target.value)}
                        className="bk-field"
                      />
                    </div>
                    <div>
                      <label className={fieldLabelCls}>Budget target</label>
                      <input
                        type="number"
                        value={budgetTarget}
                        onChange={(e) => editBudget(e.target.value)}
                        className="bk-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabelCls}>Currency</label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => editCurrency(e.target.value)}
                        className="bk-field-select"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--color-bk-muted)]" />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {tab === "connections" && (
              <section className="bk-enter">
                <SectionHead icon={Landmark} title="Connections" desc="Linked banks that sync balances and transactions automatically." />

                {connLoading && connections === null ? (
                  <div className="flex items-center gap-2 text-[13px] text-[var(--color-bk-muted)]">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                  </div>
                ) : connections && connections.length > 0 ? (
                  <div className="flex flex-col gap-2.5 max-w-[460px]">
                    {connections.map((c) => {
                      const needsFix = c.status === "login_required" || c.status === "error";
                      const statusLabel =
                        c.status === "active" ? "Connected" : c.status === "login_required" ? "Needs reconnect" : "Sync error";
                      const busy = disconnecting === c.itemId;
                      return (
                        <div
                          key={c.itemId}
                          className="flex items-center gap-3 rounded-xl border border-[var(--color-bk-line)] bg-[oklch(98%_0.004_90)] p-3.5"
                        >
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                            style={{ background: "var(--accent)", color: "var(--color-primary)" }}
                          >
                            <Landmark className="w-[17px] h-[17px]" strokeWidth={1.9} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[13.5px] font-semibold text-[var(--color-bk-ink)]">
                                {c.institutionName || "Bank"}
                              </span>
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                                style={
                                  needsFix
                                    ? { background: "var(--color-bk-clay-tint)", color: "var(--color-bk-clay)" }
                                    : { background: "var(--accent)", color: "var(--color-primary)" }
                                }
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <div className="text-[12px] text-[var(--color-bk-muted)] mt-0.5">
                              {c.accountCount} {c.accountCount === 1 ? "account" : "accounts"}
                              {c.lastSyncedAt
                                ? ` · Updated ${new Date(c.lastSyncedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`
                                : ""}
                            </div>
                          </div>
                          {needsFix && (
                            <button
                              type="button"
                              onClick={() => startConnect(c.itemId)}
                              className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 text-[12.5px] font-semibold text-white hover:opacity-85"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reconnect
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => disconnect(c.itemId)}
                            disabled={busy}
                            aria-label={`Disconnect ${c.institutionName || "bank"}`}
                            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-bk-line)] px-3 text-[12.5px] font-medium text-[var(--color-bk-muted)] hover:border-[var(--color-bk-clay)] hover:text-[var(--color-bk-clay)] transition-colors disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                            {busy ? "Removing…" : "Disconnect"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--color-bk-muted)] max-w-[420px]">
                    No banks connected yet. Link one to import balances and transactions automatically.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => startConnect()}
                  className="mt-4 flex h-10 items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 text-[13px] font-semibold text-white hover:opacity-85"
                >
                  <Plus className="w-4 h-4" /> Connect a bank
                </button>
              </section>
            )}

            {tab === "appearance" && (
              <section className="bk-enter">
                <SectionHead icon={Palette} title="Appearance" desc="Choose an accent color." />
                <SchemePicker accent={accent} onAccentChange={onAccentChange} />
              </section>
            )}

            {tab === "data" && (
              <div className="bk-enter flex flex-col gap-8">
                {/* Export — benign, kept well away from delete */}
                <section>
                  <SectionHead icon={Download} title="Your data" desc="Export all of your user data." />
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const res = await fetch("/api/settings/export");
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "bulga-export.json";
                        a.click();
                      }
                    }}
                    className="h-10 shrink-0 rounded-full border border-[var(--color-bk-line)] bg-[var(--color-bk-surface)] px-4 text-[13px] font-medium text-[var(--color-bk-ink)]"
                  >
                    Export data
                  </Button>
                </section>

                {/* Danger zone — delete only */}
                <section
                  className="rounded-2xl p-6"
                  style={{ background: "var(--color-bk-clay-tint)", border: "1px solid var(--color-bk-clay)" }}
                >
                  <SectionHead
                    icon={ShieldAlert}
                    title="Danger zone"
                    desc="Permanently delete your account and all of its data."
                    tone="clay"
                  />
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={armDelete}
                      aria-label="Delete account"
                      className="h-9 rounded-full flex items-center gap-2 px-4 shrink-0 cursor-pointer text-[13px] font-semibold text-white bg-[oklch(60%_0.16_25)] hover:bg-[var(--color-bk-clay)] transition-[background-color] duration-200"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Delete account</span>
                    </button>
                  ) : (
                    <div className="bk-enter">
                      <p className="text-[13px] font-semibold text-[var(--color-bk-clay)]">
                        Are you sure? This permanently deletes your account and can’t be undone.
                      </p>
                      <p className="mt-3 text-[12.5px] text-[var(--color-bk-ink)]">
                        Type <span className="font-semibold">{DELETE_PHRASE}</span> to confirm.
                      </p>
                      <input
                        autoFocus
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && deleteUnlocked) handleDeleteAccount();
                          if (e.key === "Escape") disarmDelete();
                        }}
                        placeholder={DELETE_PHRASE}
                        aria-label={`Type "${DELETE_PHRASE}" to confirm`}
                        className="bk-field mt-2 max-w-[300px] bg-[var(--color-bk-surface)]"
                      />
                      <div className="mt-3 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={!deleteUnlocked || deleting}
                          aria-label="Confirm delete account"
                          className="h-9 rounded-full flex items-center gap-2 px-4 shrink-0 cursor-pointer text-[13px] font-semibold text-white bg-[var(--color-bk-clay)] hover:bg-[oklch(58%_0.12_38)] transition-[background-color,opacity] duration-200 disabled:opacity-45 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">{deleting ? "Deleting…" : "Delete account"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={disarmDelete}
                          disabled={deleting}
                          className="h-9 rounded-full px-4 shrink-0 cursor-pointer text-[13px] font-medium text-[var(--color-bk-muted)] hover:text-[var(--color-bk-ink)] hover:bg-[var(--color-bk-surface)] transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Autosave status — quiet inline line. Appearance applies live and
                Data has its own actions, so this shows only on the form tabs. */}
            {(tab === "profile" || tab === "money") && saveStatus !== "idle" && (
              <div className="mt-7 flex items-center gap-1.5 text-[12.5px] font-medium">
                {saveStatus === "saving" && <span className="text-[var(--color-bk-faint)]">Saving…</span>}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 text-[var(--color-primary)]">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
                    Saved
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-[var(--color-bk-clay)]">Couldn’t save — check your connection.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
