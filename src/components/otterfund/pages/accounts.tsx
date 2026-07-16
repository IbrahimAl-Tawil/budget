"use client";

// otterfund ACCOUNTS page (the statement).
//
// A net-worth hero (serif figure over a guilloché field, with the month-by-month
// trend beneath) leads into the balance sheet: accounts grouped either by derived
// section (Cash & savings / Investments / Credit — default) or by bank, each
// group a floating header + subtotal over a hairline ledger — no bordered boxes.
// The grouping toggle + manual sync live in one "Options" dropdown, shown only
// when a bank is linked. Wired to real AccountView data passed in as props.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Landmark, RefreshCw, Check, ChevronDown, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuRadioGroup,
  MenuRadioItem,
} from "@/components/ui/menu";

import type { AccountView, NetWorthPoint } from "@/lib/types";
import { fmt } from "@/lib/format";
import { ACCOUNT_TYPES, accountGroupOf, type AccountGroup } from "@/lib/constants";
import { tintFor, type OtterfundTheme } from "@/components/otterfund/theme";
import { StatPill } from "@/components/otterfund/stat-pill";
import { MerchantAvatar } from "@/components/otterfund/merchant-avatar";
import { NetWorthSparkline } from "@/components/otterfund/net-worth-sparkline";
import { Statement, HeroBand, Ledger, Row } from "@/components/otterfund/ledger";
import { EmptyState } from "@/components/otterfund/empty-state";
import { gqlClient, errMessage } from "@/lib/graphql/client";

const SYNC_PLAID = /* GraphQL */ `
  mutation SyncPlaid { syncPlaid }
`;

interface OtterfundAccountsProps {
  accounts: AccountView[];
  netWorth: number;
  /** Month-by-month net-worth history for the hero sparkline. */
  netWorthTrend?: NetWorthPoint[];
  /** This month's net-worth change — the signed pill beside the figure. */
  netWorthChange?: number;
  accent: string;
  theme: OtterfundTheme;
  currency?: string;
  onAdd?: () => void;
  onConnect?: () => void;
  onEdit?: (a: AccountView) => void;
  /** Re-fetch the page's RSC after a successful sync. */
  onSynced?: () => void;
  /** Open the Investments drill-in (portfolio + holdings). */
  onViewInvestments?: () => void;
}

type GroupKey = AccountGroup;

const GROUP_LABELS: Record<GroupKey, string> = {
  cash: "Cash & savings",
  loans: "Loans & mortgages",
  invest: "Investments",
  credit: "Credit",
};

// Render order — groups appear top-to-bottom in this sequence.
const GROUP_ORDER: GroupKey[] = ["cash", "loans", "invest", "credit"];

// Avatar tint keys, chosen so the group's accounts read as a coherent family.
const GROUP_TINT_KEY: Record<GroupKey, string> = {
  cash: "Bills",
  loans: "Housing",
  invest: "Subscriptions",
  credit: "Entertainment",
};

/** Canonical display label for a stored account type ("credit-card" → "Credit Card"). */
function typeLabel(type: string): string {
  const t = type.trim().toLowerCase().replace(/-/g, " ");
  const known = ACCOUNT_TYPES.find((k) => k.toLowerCase() === t);
  return known ?? (t.charAt(0).toUpperCase() + t.slice(1));
}

/** Treat an account's bg as a usable CSS color (not empty / placeholder). */
function usableColor(bg: string | undefined): bg is string {
  if (!bg) return false;
  const v = bg.trim();
  return v.length > 0 && v.toLowerCase() !== "transparent" && v.toLowerCase() !== "none";
}

export function OtterfundAccounts({ accounts, netWorth, netWorthTrend = [], netWorthChange = 0, theme, currency = "CAD", onAdd, onConnect, onEdit, onSynced, onViewInvestments }: OtterfundAccountsProps) {
  const hasLinkedBank = accounts.some((a) => a.synced);
  const hasTrend = netWorthTrend.length > 0;
  const money = (n: number) => fmt(n, currency);
  const signed = (n: number) => `${n < 0 ? "−" : "+"}${money(n)}`;
  const nwDown = netWorthChange < 0;
  const [isSyncing, startSync] = useTransition();
  const [syncError, setSyncError] = useState("");
  const router = useRouter();

  // Grouping view. "type" is the default; "bank" clusters each linked
  // institution's accounts, manual ones pooled last. Only reachable with a
  // linked bank — the Options menu that switches it is hidden otherwise, and the
  // guard below snaps back to "type" if the last bank is disconnected mid-session.
  const [groupBy, setGroupBy] = useState<"type" | "bank">("type");
  const mode = hasLinkedBank ? groupBy : "type";

  const handleSync = () => {
    setSyncError("");
    startSync(async () => {
      try {
        await gqlClient.request(SYNC_PLAID);
        onSynced?.();
      } catch (e) {
        setSyncError(errMessage(e));
      }
    });
  };

  // Group subtotal excludes hidden accounts, matching net worth.
  const totalOf = (items: AccountView[]) => items.reduce((sum, a) => sum + (a.excluded ? 0 : a.balance), 0);

  // Bucket the accounts, preserving their incoming order within each group.
  let groups: { key: string; label: string; items: AccountView[]; total: number }[];
  if (mode === "bank") {
    const byKey = new Map<string, AccountView[]>();
    for (const a of accounts) {
      const key = a.synced ? `bank:${a.institution?.trim() || "Linked bank"}` : "manual";
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(a);
    }
    const ordered = [...byKey.keys()].filter((k) => k !== "manual");
    if (byKey.has("manual")) ordered.push("manual");
    groups = ordered.map((key) => {
      const items = byKey.get(key)!;
      return {
        key,
        label: key === "manual" ? "Manual accounts" : key.slice("bank:".length),
        items,
        total: totalOf(items),
      };
    });
  } else {
    const buckets: Record<GroupKey, AccountView[]> = { cash: [], loans: [], invest: [], credit: [] };
    for (const a of accounts) buckets[accountGroupOf(a.type)].push(a);
    groups = GROUP_ORDER.filter((key) => buckets[key].length > 0).map((key) => ({
      key,
      label: GROUP_LABELS[key],
      items: buckets[key],
      total: totalOf(buckets[key]),
    }));
  }

  return (
    <Statement>
      {/* net-worth hero */}
      <HeroBand
        theme={theme}
        ariaLabel="Net worth"
        asideAlign="start"
        eyebrow={
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-of-muted)" }}>
            Net worth · {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </div>
        }
        figure={fmt(netWorth, currency)}
        meta={
          hasTrend ? (
            <StatPill
              theme={theme}
              tone={nwDown ? "clay" : "accent"}
              figure={signed(netWorthChange)}
              label="this month"
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d={nwDown ? "M7 7 17 17M9 17h8V9" : "M7 17 17 7M9 7h8v8"} />
                </svg>
              }
            />
          ) : undefined
        }
        aside={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button size="sm" onClick={() => onConnect?.()} aria-label="Connect a bank">
                <Landmark data-icon="inline-start" size={16} strokeWidth={2} />
                Connect a bank
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAdd?.()} aria-label="Add account" className="border-dashed">
                <Plus data-icon="inline-start" size={16} strokeWidth={2} />
                Add account
              </Button>
              {hasLinkedBank && (
                <Menu>
                  <MenuTrigger
                    render={
                      <Button variant="outline" size="sm" aria-label="Account view options">
                        {isSyncing ? (
                          <RefreshCw data-icon="inline-start" size={15} strokeWidth={2} className="of-spin" />
                        ) : (
                          <SlidersHorizontal data-icon="inline-start" size={15} strokeWidth={2} />
                        )}
                        {isSyncing ? "Syncing…" : "Options"}
                        <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" />
                      </Button>
                    }
                  />
                  <MenuContent align="end" className="min-w-[210px]">
                    <MenuItem onClick={handleSync} disabled={isSyncing}>
                      <RefreshCw size={15} strokeWidth={2} aria-hidden="true" />
                      <span>Sync accounts</span>
                    </MenuItem>
                    <MenuSeparator />
                    <div className="px-2.5 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--color-of-faint)]">
                      Group by
                    </div>
                    <MenuRadioGroup value={groupBy}>
                      <MenuRadioItem value="type" onClick={() => setGroupBy("type")}>
                        <span>Account type</span>
                        {groupBy === "type" && <Check size={15} strokeWidth={2.5} style={{ color: theme.accent, flexShrink: 0 }} aria-hidden="true" />}
                      </MenuRadioItem>
                      <MenuRadioItem value="bank" onClick={() => setGroupBy("bank")}>
                        <span>Bank</span>
                        {groupBy === "bank" && <Check size={15} strokeWidth={2.5} style={{ color: theme.accent, flexShrink: 0 }} aria-hidden="true" />}
                      </MenuRadioItem>
                    </MenuRadioGroup>
                  </MenuContent>
                </Menu>
              )}
            </div>
            {syncError && (
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--color-of-clay)", maxWidth: 320 }}>{syncError}</span>
            )}
          </div>
        }
        below={
          hasTrend ? (
            <NetWorthSparkline trend={netWorthTrend} theme={theme} money={money} signed={signed} currency={currency} height={104} />
          ) : undefined
        }
      />

      {/* Cold start — no accounts yet. The hero above already carries the
          Connect / Add actions, so the empty state is copy-only guidance. */}
      {accounts.length === 0 && (
        <EmptyState
          theme={theme}
          title="No accounts yet"
          description="Connect a bank to sync balances automatically, or add an account by hand. Either way your net worth builds here. Use the buttons above to start."
        />
      )}

      {/* groups */}
      {groups.map((grp) => {
        const totalNegative = grp.total < 0;
        return (
          <section key={grp.key} style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "oklch(48% 0.012 80)",
                  }}
                >
                  {grp.label}
                </h3>
                {grp.key === "invest" && onViewInvestments && (
                  <Button variant="link" size="xs" onClick={() => onViewInvestments()} className="text-[12px]">
                    <TrendingUp strokeWidth={2.2} aria-hidden="true" />
                    View portfolio →
                  </Button>
                )}
              </div>
              <span className="of-num" style={{ fontSize: 14, color: "oklch(48% 0.012 80)" }}>
                {(totalNegative ? "−" : "") + fmt(Math.abs(grp.total), currency)}
              </span>
            </div>

            <Ledger>
              {grp.items.map((a) => {
                const negative = a.balance < 0;
                // Tint by the account's own type-family (not the visible group) so
                // an account's avatar stays identical across both views.
                const fallback = tintFor(GROUP_TINT_KEY[accountGroupOf(a.type)]);
                const tileBg = usableColor(a.bg) ? a.bg : fallback[0];
                const tileInk = usableColor(a.bg) ? "#fff" : fallback[1];
                // For synced accounts show institution + last update — except in
                // bank view, where the institution IS the group header, so show
                // the account type instead. Manual rows keep number + change.
                const parts = a.synced
                  ? [mode === "bank" ? typeLabel(a.type) : a.institution, a.syncedLabel && `Updated ${a.syncedLabel}`]
                  : [a.num, a.change];
                const meta = parts.filter((p) => p && String(p).trim()).join(" · ");
                return (
                  <Row
                    key={a.id}
                    columns="44px 1fr auto 18px"
                    gap={15}
                    onClick={() => onEdit?.(a)}
                    ariaLabel={`Edit ${a.name}`}
                    style={{ opacity: a.excluded ? 0.5 : 1 }}
                  >
                    {/* Any account with a recognised bank shows that bank's logo
                        (synced accounts get it from Plaid's institution; manual
                        ones from the Bank field). Falls back to the institution's
                        initial, then the account name's. */}
                    <MerchantAvatar
                      name={a.institution || a.name}
                      domain={a.domain}
                      bg={tileBg}
                      ink={tileInk}
                      size={40}
                      fit="contain"
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.name}
                        </span>
                        {a.synced && (
                          <span
                            style={{
                              flexShrink: 0,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              background: "var(--accent)",
                              color: "var(--accent-foreground)",
                              fontSize: 10.5,
                              fontWeight: 600,
                              letterSpacing: "0.02em",
                            }}
                          >
                            Synced
                          </span>
                        )}
                        {a.excluded && (
                          <span
                            style={{
                              flexShrink: 0,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              background: "var(--color-of-line-soft)",
                              color: "var(--color-of-muted)",
                              fontSize: 10.5,
                              fontWeight: 600,
                              letterSpacing: "0.02em",
                            }}
                          >
                            Hidden
                          </span>
                        )}
                      </div>
                      {meta && <div style={{ fontSize: 12.5, color: "var(--color-of-muted)", marginTop: 1 }}>{meta}</div>}
                      {/* Manual entries sitting on a synced account don't move its
                          bank-truth balance — surface them (and let the user review /
                          remove duplicates) via the Transactions ledger, pre-filtered
                          to this account's manual rows. */}
                      {a.synced && (a.unsyncedManualCount ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/transactions?account=${a.id}&source=manual`);
                          }}
                          style={{
                            marginTop: 3,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: 0,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 12,
                            fontWeight: 600,
                            color: theme.accentDeep,
                          }}
                        >
                          {a.unsyncedManualCount} {a.unsyncedManualCount === 1 ? "entry" : "entries"} not from your bank · Review
                        </button>
                      )}
                    </div>
                    <div className="of-num" style={{ fontSize: 16, fontWeight: 500, color: negative ? theme.clay : "var(--color-of-ink)" }}>
                      {(negative ? "−" : "") + fmt(Math.abs(a.balance), currency)}
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(70% 0.01 80)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </Row>
                );
              })}
            </Ledger>
          </section>
        );
      })}
    </Statement>
  );
}
