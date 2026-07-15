"use client";

// otterfund — TRANSACTIONS page (the statement).
//
// The month's movements read like a printed statement: a quiet search + filter
// line, then rows grouped by day under a floating date header (Today / Yesterday
// / weekday), each with the day's net beside it. No table, no enclosing box —
// rows sit on the paper, split by hairlines, and light with the accent wash on
// hover. Search filters by merchant / category; the All / Income / Spending
// toggle and the account filter narrow the set. Bulk-select (with shift-range)
// and delete are preserved. Every row is a real TransactionView — no sample data.

import { useEffect, useMemo, useState, useTransition } from "react";
import { Trash2, Check, ChevronDown, Upload, Plus } from "lucide-react";
import type { TransactionView } from "@/lib/types";
import type { OtterfundTheme } from "@/components/otterfund/theme";
import { tintFor } from "@/components/otterfund/theme";
import { GuillocheSeal } from "@/components/otterfund/guilloche";
import { EmptyState, AddAccountEmptyState } from "@/components/otterfund/empty-state";
import { SegmentedToggle } from "@/components/otterfund/segmented-toggle";
import { MerchantAvatar } from "@/components/otterfund/merchant-avatar";
import { Statement, Ledger, Row } from "@/components/otterfund/ledger";
import { fmt } from "@/lib/format";
import { gqlClient } from "@/lib/graphql/client";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuCheckboxItem,
  MenuSeparator,
} from "@/components/ui/menu";

const DELETE_TRANSACTIONS = /* GraphQL */ `
  mutation DeleteTransactions($ids: [ID!]!) {
    deleteTransactions(ids: $ids) { ok }
  }
`;

interface OtterfundTransactionsProps {
  transactions: TransactionView[];
  accounts: { id: string; name: string }[];
  accent: string;
  theme: OtterfundTheme;
  currency?: string;
  /** False when the user has no accounts at all — the empty view then guides them
      to add/connect an account rather than to add a transaction. */
  hasAccounts?: boolean;
  onEdit?: (t: TransactionView) => void;
  /** Called after a successful bulk delete so the RSC re-fetches. */
  onBulkDeleted?: () => void;
  /** Open the statement-import modal (inline toolbar action). */
  onImport?: () => void;
  /** Open the add-transaction modal (inline toolbar action). */
  onAdd?: () => void;
  /** Open the add-ACCOUNT modal (from the cold-start empty view). */
  onAddAccount?: () => void;
  /** Open the Connect-a-bank modal (from the cold-start empty view). */
  onConnect?: () => void;
}

type Segment = "all" | "income" | "spending";
// "bank" = live Plaid sync; "manual" = anything the user added themselves
// (typed or CSV-imported). Lets the ledger answer "which of these came from my
// bank vs. did I add?" — and powers the Accounts-page deep-link to review the
// manual entries sitting on a synced account.
type SourceFilter = "all" | "bank" | "manual";

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "spending", label: "Spending" },
];

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `YYYY-MM-DD` (local) for a Date — matches the server's formatDayISO. */
function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** One day's cluster of transactions (rows arrive newest-first, so same-day rows
    are already contiguous — we just break the run when the day key changes). */
interface DayGroup {
  key: string;
  /** Bold primary label — Today / Yesterday / weekday, or the raw date string
      when no ISO day is available. */
  primary: string;
  /** Faint absolute date beside it ("Jul 12"); empty in the fallback path. */
  secondary: string;
  total: number;
  items: TransactionView[];
}

export function OtterfundTransactions({ transactions, accounts, theme, currency = "CAD", hasAccounts = true, onEdit, onBulkDeleted, onImport, onAdd, onAddAccount, onConnect }: OtterfundTransactionsProps) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  // Empty set = all accounts. Otherwise, only these account ids are shown.
  const [acctFilter, setAcctFilter] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDeleting, startDelete] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // "Today" is resolved client-side (after mount) so SSR and client never
  // disagree on the day — until then, headers show the absolute weekday only.
  const [todayKey, setTodayKey] = useState<string | null>(null);
  useEffect(() => {
    setTodayKey(localISO(new Date()));
  }, []);

  // Honor a deep-link from the Accounts page ("N not from your bank" →
  // ?account=<id>&source=manual): preset the filters once on mount so the ledger
  // opens already narrowed to those entries. Read the URL directly (not
  // useSearchParams, which would force a Suspense boundary); applied post-mount
  // so it can't cause a hydration mismatch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const src = params.get("source");
    if (src === "manual" || src === "bank") setSourceFilter(src);
    const acct = params.get("account");
    if (acct) setAcctFilter(new Set([acct]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (segment === "income" && t.amount <= 0) return false;
      if (segment === "spending" && t.amount >= 0) return false;
      // bank = Plaid-synced; manual = everything else (typed or CSV).
      if (sourceFilter === "bank" && t.source !== "plaid") return false;
      if (sourceFilter === "manual" && t.source === "plaid") return false;
      if (acctFilter.size > 0 && !(t.accountId && acctFilter.has(t.accountId))) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    });
  }, [transactions, query, segment, sourceFilter, acctFilter]);

  // Bucket the (already date-desc) rows into contiguous day groups.
  const groups = useMemo<DayGroup[]>(() => {
    const yesterdayKey =
      todayKey != null ? localISO(new Date(new Date(todayKey + "T00:00:00").getTime() - 86400000)) : null;
    const out: DayGroup[] = [];
    for (const t of filtered) {
      const key = t.dateISO ?? t.date;
      let g = out[out.length - 1];
      if (!g || g.key !== key) {
        let primary = t.date;
        let secondary = "";
        if (t.dateISO) {
          const [y, m, d] = t.dateISO.split("-").map(Number);
          const dt = new Date(y, (m || 1) - 1, d || 1);
          secondary = `${MONTH[dt.getMonth()]} ${dt.getDate()}`;
          primary =
            todayKey && t.dateISO === todayKey
              ? "Today"
              : yesterdayKey && t.dateISO === yesterdayKey
                ? "Yesterday"
                : WEEKDAY[dt.getDay()];
        }
        g = { key, primary, secondary, total: 0, items: [] };
        out.push(g);
      }
      g.items.push(t);
      g.total += t.amount;
    }
    return out;
  }, [filtered, todayKey]);

  const toggleAcct = (id: string) => {
    setAcctFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // A search/segment/source/account filter is narrowing the set — distinguishes
  // "no match for this filter" from "genuinely nothing here yet" in the empty view.
  const filterActive =
    query.trim() !== "" || segment !== "all" || sourceFilter !== "all" || acctFilter.size > 0;

  const acctLabel =
    acctFilter.size === 0
      ? "All accounts"
      : acctFilter.size === 1
        ? accounts.find((a) => acctFilter.has(a.id))?.name ?? "1 account"
        : `${acctFilter.size} accounts`;

  // Show the source control + per-row "Manual" marker only when the ledger
  // actually mixes bank-synced and self-added rows — an all-manual (free-tier)
  // or all-synced ledger has nothing to disambiguate.
  const mixedSources = useMemo(() => {
    let bank = false;
    let other = false;
    for (const t of transactions) {
      if (t.source === "plaid") bank = true;
      else if (t.source) other = true;
      if (bank && other) return true;
    }
    return false;
  }, [transactions]);

  const sourceLabel =
    sourceFilter === "bank" ? "From your bank" : sourceFilter === "manual" ? "Added manually" : "Any source";

  // Only ids currently visible can be selected; "select all" targets the filter.
  const visibleIds = useMemo(() => filtered.map((t) => t.id), [filtered]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const clearSelection = () => {
    setSelected(new Set());
    setConfirmingDelete(false);
    setDeleteError(false);
  };

  // Anchor for shift-range selection — the last checkbox toggled without shift.
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mail-client selection on a checkbox: shift = select the contiguous range
  // from the anchor to this row; plain/⌘ = toggle one. Ranges respect the
  // current filter (operate over visibleIds, in displayed order).
  const selectAt = (id: string, e: { shiftKey: boolean }) => {
    if (e.shiftKey && anchorId && anchorId !== id) {
      const from = visibleIds.indexOf(anchorId);
      const to = visibleIds.indexOf(id);
      if (from !== -1 && to !== -1) {
        const [lo, hi] = from < to ? [from, to] : [to, from];
        const range = visibleIds.slice(lo, hi + 1);
        setSelected((prev) => new Set([...prev, ...range]));
        return; // keep the existing anchor for further shift-clicks
      }
    }
    toggleOne(id);
    setAnchorId(id);
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      }
      return new Set([...prev, ...visibleIds]);
    });
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleteError(false);
    startDelete(async () => {
      try {
        await gqlClient.request(DELETE_TRANSACTIONS, { ids });
        clearSelection();
        onBulkDeleted?.();
      } catch {
        setDeleteError(true);
        setConfirmingDelete(false);
      }
    });
  };

  return (
    <>
      <Statement>
        {/* controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              flex: 1,
              minWidth: 200,
              height: 42,
              padding: "0 16px",
              borderRadius: 13,
              border: "1px solid var(--color-of-line)",
              background: "var(--color-of-surface)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-of-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions"
              aria-label="Search transactions"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 500,
                color: "var(--color-of-ink)",
              }}
            />
          </div>
          <SegmentedToggle ariaLabel="Transaction type" theme={theme} value={segment} onChange={setSegment} options={SEGMENTS} />

          {/* account filter — Base UI Menu; checkbox items stay open across
              multi-select, and the positioner keeps it on-screen at any width. */}
          {accounts.length > 0 && (
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    style={acctFilter.size > 0 ? { background: theme.accentTint, color: theme.accentDeep, borderColor: "transparent" } : undefined}
                  >
                    {acctLabel}
                    <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" />
                  </Button>
                }
              />
              <MenuContent align="end" className="min-w-[220px]">
                <MenuRadioGroup value={acctFilter.size === 0 ? "all" : "some"}>
                  <MenuRadioItem value="all" onClick={() => setAcctFilter(new Set())}>
                    <span>All accounts</span>
                    {acctFilter.size === 0 && <Check size={15} strokeWidth={2.5} style={{ color: theme.accent, flexShrink: 0 }} aria-hidden="true" />}
                  </MenuRadioItem>
                </MenuRadioGroup>
                <MenuSeparator />
                {accounts.map((a) => {
                  const on = acctFilter.has(a.id);
                  return (
                    <MenuCheckboxItem key={a.id} checked={on} closeOnClick={false} onCheckedChange={() => toggleAcct(a.id)}>
                      <span>{a.name}</span>
                      {on && <Check size={15} strokeWidth={2.5} style={{ color: theme.accent, flexShrink: 0 }} aria-hidden="true" />}
                    </MenuCheckboxItem>
                  );
                })}
              </MenuContent>
            </Menu>
          )}

          {/* source filter — only when the ledger mixes bank + manual rows */}
          {mixedSources && (
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    style={sourceFilter !== "all" ? { background: theme.accentTint, color: theme.accentDeep, borderColor: "transparent" } : undefined}
                  >
                    {sourceLabel}
                    <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" />
                  </Button>
                }
              />
              <MenuContent align="end" className="min-w-[200px]">
                <MenuRadioGroup value={sourceFilter}>
                  <MenuRadioItem value="all" onClick={() => setSourceFilter("all")}>
                    <span>Any source</span>
                    {sourceFilter === "all" && <Check size={15} strokeWidth={2.5} style={{ color: theme.accent, flexShrink: 0 }} aria-hidden="true" />}
                  </MenuRadioItem>
                  <MenuRadioItem value="bank" onClick={() => setSourceFilter("bank")}>
                    <span>From your bank</span>
                    {sourceFilter === "bank" && <Check size={15} strokeWidth={2.5} style={{ color: theme.accent, flexShrink: 0 }} aria-hidden="true" />}
                  </MenuRadioItem>
                  <MenuRadioItem value="manual" onClick={() => setSourceFilter("manual")}>
                    <span>Added manually</span>
                    {sourceFilter === "manual" && <Check size={15} strokeWidth={2.5} style={{ color: theme.accent, flexShrink: 0 }} aria-hidden="true" />}
                  </MenuRadioItem>
                </MenuRadioGroup>
              </MenuContent>
            </Menu>
          )}

          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport} aria-label="Import statement">
              <Upload data-icon="inline-start" size={15} strokeWidth={2} aria-hidden="true" />
              Import
            </Button>
          )}

          {onAdd && (
            <Button variant="outline" size="sm" className="border-dashed" onClick={onAdd} aria-label="Add transaction">
              <Plus data-icon="inline-start" size={16} strokeWidth={2.4} aria-hidden="true" />
              Add transaction
            </Button>
          )}
        </div>

        {/* select-all — a quiet line above the ledger, shown once there are rows */}
        {filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 0 2px", color: "var(--color-of-muted)" }}>
            <OfCheckbox checked={allVisibleSelected} onToggle={toggleAllVisible} theme={theme} ariaLabel="Select all" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {selected.size > 0 ? `${selected.size} selected` : `${filtered.length} ${filtered.length === 1 ? "transaction" : "transactions"}`}
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          filterActive ? (
            // A filter is on but nothing matches — the set isn't empty, the query is.
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "72px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ width: 72, height: 72, marginBottom: 8 }} aria-hidden="true">
                <GuillocheSeal accent={theme.accent} accentDeep={theme.accentDeep} label="$" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-of-ink)" }}>No transactions</div>
              <div style={{ fontSize: 13, color: "var(--color-of-muted)" }}>Nothing matches your search or filter.</div>
            </div>
          ) : !hasAccounts ? (
            // Cold start — no accounts at all, so there's nothing to import from yet.
            <AddAccountEmptyState
              theme={theme}
              onAdd={onAddAccount}
              onConnect={onConnect}
              title="No transactions yet"
              description="Connect a bank to pull your transactions in automatically, or add an account and record them by hand."
            />
          ) : (
            // Has accounts, but this month is empty — nudge toward adding/importing.
            <EmptyState
              theme={theme}
              title="No transactions this month"
              description="Nothing recorded for this period yet. Add one by hand or import a statement to fill it in."
              actions={
                <>
                  {onAdd && (
                    <Button size="sm" onClick={onAdd} aria-label="Add transaction">
                      <Plus data-icon="inline-start" size={16} strokeWidth={2.4} aria-hidden="true" />
                      Add transaction
                    </Button>
                  )}
                  {onImport && (
                    <Button variant="outline" size="sm" onClick={onImport} aria-label="Import statement">
                      <Upload data-icon="inline-start" size={15} strokeWidth={2} aria-hidden="true" />
                      Import
                    </Button>
                  )}
                </>
              }
            />
          )
        ) : (
          groups.map((g, gi) => (
            <section key={g.key} aria-label={`${g.primary}${g.secondary ? ` ${g.secondary}` : ""}`}>
              {/* floating day header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  margin: gi === 0 ? "12px 0 2px" : "24px 0 2px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", color: "var(--color-of-ink)" }}>{g.primary}</span>
                  {g.secondary && <span style={{ fontSize: 12.5, color: "var(--color-of-faint)" }}>{g.secondary}</span>}
                </div>
                <span className="of-num" style={{ fontSize: 12.5, color: "var(--color-of-faint)" }}>
                  {(g.total >= 0 ? "+" : "−") + fmt(Math.abs(g.total), currency)}
                </span>
              </div>

              <Ledger>
                {g.items.map((t) => {
                  const [tint, ink] = tintFor(t.category);
                  const income = t.amount > 0;
                  const amountLabel = (income ? "+" : "−") + fmt(Math.abs(t.amount), currency);
                  const isSelected = selected.has(t.id);
                  const meta = [t.category, t.accountName && acctFilter.size !== 1 ? t.accountName : null]
                    .filter((p) => p && String(p).trim())
                    .join(" · ");
                  return (
                    <Row
                      key={t.id}
                      columns="26px 1fr auto"
                      gap={14}
                      onClick={() => onEdit?.(t)}
                      selected={isSelected}
                      ariaLabel={`Edit ${t.name}`}
                    >
                      <OfCheckbox
                        checked={isSelected}
                        onToggle={(e) => selectAt(t.id, e)}
                        theme={theme}
                        ariaLabel={`Select ${t.name}`}
                        stopPropagation
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                        <MerchantAvatar name={t.name} bg={tint} ink={ink} size={36} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {t.name}
                            </span>
                            {/* subtle marker for a self-added row — only shown when
                                the ledger mixes bank + manual, so it reads as "this
                                one isn't from your bank" rather than noise */}
                            {mixedSources && t.source && t.source !== "plaid" && (
                              <span
                                style={{
                                  flexShrink: 0,
                                  padding: "1px 7px",
                                  borderRadius: 9999,
                                  background: "var(--color-of-line-soft)",
                                  color: "var(--color-of-muted)",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  letterSpacing: "0.02em",
                                }}
                              >
                                Manual
                              </span>
                            )}
                          </div>
                          {meta && (
                            <div style={{ fontSize: 12, color: "var(--color-of-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
                              {meta}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className="of-num"
                        style={{ fontSize: 14, fontWeight: 500, textAlign: "right", color: income ? theme.accentDeep : "var(--color-of-ink)" }}
                      >
                        {amountLabel}
                      </span>
                    </Row>
                  );
                })}
              </Ledger>
            </section>
          ))
        )}
      </Statement>

      {/* bulk-action bar — fixed to the viewport bottom, screen-centered. Kept a
          sibling of the Statement so its permanent enter-transform doesn't
          re-root this fixed element to the content column. */}
      {selected.size > 0 && (
        <div
          className="of-pop of-bulkbar"
          style={{
            position: "fixed",
            left: 60,
            right: 0,
            bottom: 28,
            marginInline: "auto",
            width: "fit-content",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 12px 10px 20px",
            borderRadius: 999,
            background: "var(--color-of-tooltip)",
            boxShadow: "0 16px 40px oklch(20% 0.02 80 / 0.28)",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", color: deleteError ? "oklch(78% 0.09 33)" : "var(--color-of-tooltip-ink)" }}>
            {deleteError ? "Couldn't delete. Try again" : confirmingDelete ? "Are you sure?" : `${selected.size} selected`}
          </span>
          <Button size="sm" onClick={clearSelection} disabled={isDeleting} className="bg-transparent text-white/70 hover:bg-white/10 hover:text-white">
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleBulkDelete} disabled={isDeleting}>
            <Trash2 data-icon="inline-start" style={{ width: 15, height: 15 }} />
            {isDeleting ? "Deleting…" : confirmingDelete ? "Confirm" : "Delete"}
          </Button>
        </div>
      )}
    </>
  );
}

/** On-brand checkbox — rounded square, hairline when empty, accent fill + check
    when on. Used for row selection; matches the app's radius + accent language. */
function OfCheckbox({
  checked,
  onToggle,
  theme,
  ariaLabel,
  stopPropagation = false,
}: {
  checked: boolean;
  onToggle: (e: React.MouseEvent) => void;
  theme: OtterfundTheme;
  ariaLabel: string;
  stopPropagation?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onToggle(e);
      }}
      style={{
        display: "grid",
        placeItems: "center",
        width: 26,
        height: 26,
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 18,
          height: 18,
          borderRadius: 6,
          border: checked ? "none" : "1.5px solid var(--color-of-line)",
          background: checked ? theme.accent : "var(--color-of-surface)",
          transition: "background .14s, border-color .14s",
        }}
      >
        {checked && <Check size={12} strokeWidth={3} color="#fff" aria-hidden="true" />}
      </span>
    </button>
  );
}
