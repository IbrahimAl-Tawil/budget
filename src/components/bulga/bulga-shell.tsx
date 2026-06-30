"use client";

// BulgaShell — the Bulga app shell, the Bulga design system.
//
// Layout: warm canvas,
// 1340px rounded surface card, topbar + scroll canvas) with ONE deliberate
// deviation: the sidebar is a COLLAPSED dark icon-rail (Wealthsimple style)
// instead of the reference's expanded labeled sidebar. Each rail icon carries
// a hover tooltip. The whole palette is hue-derived from a single switchable
// accent, exposed as --bk-accent on the root and passed to every page.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, List, CreditCard, Target, Sparkles, Bell, Plus, ChevronDown, Calendar, Settings, LogOut, PieChart, Repeat, Lightbulb } from "lucide-react";
import { AddTransactionModal } from "@/components/dashboard/modals/add-transaction-modal";
import { ImportModal } from "@/components/dashboard/modals/import-modal";
import { EditTransactionModal } from "@/components/dashboard/modals/edit-transaction-modal";
import { AddGoalModal } from "@/components/dashboard/modals/add-goal-modal";
import { EditGoalModal } from "@/components/dashboard/modals/edit-goal-modal";
import { AddAccountModal } from "@/components/dashboard/modals/add-account-modal";
import { EditAccountModal } from "@/components/dashboard/modals/edit-account-modal";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { SettingsModal } from "@/components/dashboard/modals/settings-modal";
import type {
  DashboardOverview,
  SpendCategory,
  GoalView,
  TransactionView,
  SubscriptionView,
  AccountView,
  InsightView,
} from "@/lib/types";
import { DEFAULT_ACCENT, deriveTheme, themeVars, hueOf } from "@/components/bulga/theme";
import { LogoMark } from "@/components/bulga/logo";
import { BulgaOverview } from "@/components/bulga/pages/overview";
import { BulgaTransactions } from "@/components/bulga/pages/transactions";
import { BulgaAccounts } from "@/components/bulga/pages/accounts";
import { BulgaGoals } from "@/components/bulga/pages/goals";
import { BulgaSpending } from "@/components/bulga/pages/spending";
import { BulgaSubscriptions } from "@/components/bulga/pages/subscriptions";
import { BulgaInsights } from "@/components/bulga/pages/insights";
import { BulgaBrandKit } from "@/components/bulga/pages/brand-kit";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type View = "overview" | "transactions" | "spending" | "subscriptions" | "accounts" | "goals" | "insights" | "brand";

interface InitialData {
  overview: DashboardOverview;
  spending: SpendCategory[];
  goals: GoalView[];
  transactions: { transactions: TransactionView[]; total: number; totalPages: number };
  subscriptions: SubscriptionView[];
  accounts: AccountView[];
  insights: InsightView[];
  /** Persisted brand accent (oklch); null falls back to the default evergreen. */
  accent: string | null;
  month: number;
  year: number;
}

interface NavItem {
  id: View;
  label: string;
  Icon: typeof Home;
}

const PRIMARY_NAV: NavItem[] = [
  { id: "overview", label: "Overview", Icon: Home },
  { id: "transactions", label: "Transactions", Icon: List },
  { id: "spending", label: "Spending", Icon: PieChart },
  { id: "subscriptions", label: "Subscriptions", Icon: Repeat },
  { id: "accounts", label: "Accounts", Icon: CreditCard },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "insights", label: "Insights", Icon: Lightbulb },
];

const SECONDARY_NAV: NavItem[] = [{ id: "brand", label: "Brand kit", Icon: Sparkles }];

/** Icon-rail nav button with a tooltip that flies out to the right of the dark rail. */
function RailButton({
  item,
  active,
  accent,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  const { Icon, label } = item;
  return (
    <div className="group relative flex justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        title={label}
        className="bk-rail-btn flex h-[36px] w-[36px] items-center justify-center rounded-[11px] outline-none transition-[background,color] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
        style={
          active
            ? {
                background: accent,
                color: "#fff",
                boxShadow: `0 2px 8px oklch(40% 0.1 ${hueOf(accent)} / 0.28)`,
              }
            : { color: "var(--color-bk-rail-icon)" }
        }
      >
        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {/* Tooltip — flies out to the right of the dark rail */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-[9px] px-2.5 py-1.5 text-[12px] font-semibold opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100"
        style={{
          background: "oklch(26% 0.012 75)",
          color: "#fff",
          boxShadow: "0 8px 24px oklch(20% 0.02 80 / 0.3)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function BulgaShell({ initialData }: { initialData: InitialData }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [accent, setAccent] = useState<string>(initialData.accent ?? DEFAULT_ACCENT);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editTx, setEditTx] = useState<TransactionView | null>(null);
  const [editGoal, setEditGoal] = useState<GoalView | null>(null);
  const [editAccount, setEditAccount] = useState<AccountView | null>(null);

  // Mutations live in the modals; refetch server data by re-running the page RSC.
  const refresh = () => router.refresh();

  // Switch the accent live AND persist it to the user record (fire-and-forget —
  // the UI has already applied, so a failed save just won't survive reload).
  const changeAccent = useCallback((next: string) => {
    setAccent(next);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accent: next }),
    }).catch(() => {});
  }, []);

  const theme = deriveTheme(accent);

  // Push the accent-derived tokens onto :root so they reach EVERYTHING —
  // including modals, which render through a portal into document.body and so
  // sit outside this shell's root div. Without this, dialog inputs/buttons keep
  // reading the static evergreen :root tokens from globals.css. The logo mark
  // tracks the accent too (see the rail), so the whole identity moves as one.
  useEffect(() => {
    const root = document.documentElement;
    const vars = themeVars(theme);
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k);
    };
  }, [theme]);

  const { overview, goals, transactions, accounts, spending, subscriptions, insights, month, year } = initialData;

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const txThisMonth = transactions.total;

  // Profile avatar initials from the signed-in user's name, else null (person glyph).
  const userName = session?.user?.name ?? null;
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  const titles: Record<View, [string, string]> = {
    overview: ["Overview", "Here’s where your money stands today"],
    transactions: ["Transactions", `${txThisMonth} this month · ${monthLabel}`],
    spending: ["Spending", `Budget vs. actual · ${monthLabel}`],
    subscriptions: ["Subscriptions", "What’s on repeat"],
    accounts: ["Accounts", "Everything in one place"],
    goals: ["Goals", "Saving with intent"],
    insights: ["Insights", "AI-powered reads on your money"],
    brand: ["Brand kit", "The Bulga design system"],
  };
  const [pageTitle, pageSub] = titles[view];

  const renderPage = () => {
    switch (view) {
      case "overview":
        return (
          <BulgaOverview
            overview={overview}
            onNavigate={(v) => setView(v as View)}
            accent={accent}
            theme={theme}
          />
        );
      case "transactions":
        return (
          <BulgaTransactions
            transactions={transactions.transactions}
            currency={overview.currency}
            accent={accent}
            theme={theme}
            onEdit={setEditTx}
          />
        );
      case "accounts":
        return (
          <BulgaAccounts
            accounts={accounts}
            netWorth={overview.netWorth}
            currency={overview.currency}
            accent={accent}
            theme={theme}
            onAdd={() => setShowAddAccount(true)}
            onEdit={setEditAccount}
          />
        );
      case "goals":
        return (
          <BulgaGoals
            goals={goals}
            currency={overview.currency}
            accent={accent}
            theme={theme}
            onAdd={() => setShowAddGoal(true)}
            onEdit={setEditGoal}
          />
        );
      case "spending":
        return <BulgaSpending spending={spending} currency={overview.currency} accent={accent} theme={theme} />;
      case "subscriptions":
        return <BulgaSubscriptions subscriptions={subscriptions} currency={overview.currency} accent={accent} theme={theme} />;
      case "insights":
        return <BulgaInsights insights={insights} accent={accent} theme={theme} />;
      case "brand":
        return <BulgaBrandKit accent={accent} theme={theme} onAccentChange={changeAccent} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={
        {
          // Re-tint the whole primitive layer (Button/Input/Badge/rings/tints)
          // from the active accent — not just --bk-accent. The logo mark tracks
          // the accent too (see the rail below).
          ...themeVars(theme),
          height: "100vh",
          display: "flex",
          background: "var(--color-bk-canvas)",
          overflow: "hidden",
        } as React.CSSProperties
      }
    >
      {/* ░░ ICON RAIL — full-height, flush to the left edge ░░ */}
      <aside
        style={{
          width: 60,
          flexShrink: 0,
          height: "100vh",
          background: "var(--color-bk-surface)",
          borderRight: "1px solid var(--color-bk-sidebar-line)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100%",
            padding: "20px 0",
          }}
        >
            {/* mark — tracks the active accent (pink theme → pink mark) */}
            <div style={{ marginBottom: 24 }}>
              <LogoMark size={22} bg={accent} fg="#fff" />
            </div>

            {/* primary nav */}
            <nav aria-label="Primary" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PRIMARY_NAV.map((item) => (
                <RailButton
                  key={item.id}
                  item={item}
                  active={view === item.id}
                  accent={accent}
                  onClick={() => setView(item.id)}
                />
              ))}
            </nav>

            <div
              style={{
                height: 1,
                width: 24,
                background: "var(--color-bk-sidebar-line)",
                margin: "14px 0",
              }}
            />

            {/* secondary nav */}
            <nav aria-label="Brand" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SECONDARY_NAV.map((item) => (
                <RailButton
                  key={item.id}
                  item={item}
                  active={view === item.id}
                  accent={accent}
                  onClick={() => setView(item.id)}
                />
              ))}
            </nav>

            <div style={{ flex: 1 }} />

            {/* ── profile avatar → popover (Settings · Log out) ── */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowProfileMenu((v) => !v)}
                aria-label={userName ?? "Account"}
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--bk-accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11.5,
                  fontWeight: 700,
                  flexShrink: 0,
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {initials ?? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.4" />
                    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
                  </svg>
                )}
              </button>

              {showProfileMenu && (
                <>
                  <div
                    onClick={() => setShowProfileMenu(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "calc(100% + 12px)",
                      zIndex: 50,
                      minWidth: 208,
                      padding: 6,
                      borderRadius: 14,
                      background: "var(--color-bk-surface)",
                      border: "1px solid var(--color-bk-line)",
                      boxShadow: "0 12px 32px oklch(20% 0.02 80 / 0.16)",
                    }}
                  >
                    {/* identity header */}
                    <div style={{ padding: "8px 11px 10px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-bk-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {userName ?? "Your account"}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--color-bk-faint)" }}>Free plan</div>
                    </div>
                    <div style={{ height: 1, background: "var(--color-bk-line-soft)", margin: "2px 0 4px" }} />
                    <button
                      type="button"
                      role="menuitem"
                      className="bk-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowSettings(true);
                      }}
                    >
                      <Settings size={15} strokeWidth={2} aria-hidden="true" />
                      Settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="bk-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                    >
                      <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

      {/* ░░ MAIN ░░ */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-bk-surface)",
        }}
      >
          {/* topbar */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "22px 34px",
              borderBottom: "1px solid oklch(93% 0.005 85)",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--color-bk-ink)" }}>
                {pageTitle}
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "oklch(54% 0.012 80)" }}>{pageSub}</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* month pill */}
              <button
                type="button"
                aria-label={`Month: ${monthLabel}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 38,
                  padding: "0 15px",
                  borderRadius: 999,
                  border: "1px solid oklch(91% 0.006 85)",
                  background: "oklch(98% 0.004 90)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "oklch(40% 0.012 80)",
                  cursor: "pointer",
                }}
              >
                <Calendar size={14} strokeWidth={2} aria-hidden="true" />
                {monthLabel}
                <ChevronDown size={13} strokeWidth={2.2} aria-hidden="true" />
              </button>

              {/* bell */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    border: "1px solid oklch(91% 0.006 85)",
                    background: "oklch(98% 0.004 90)",
                    color: "oklch(40% 0.012 80)",
                    cursor: "pointer",
                  }}
                >
                  <Bell size={17} strokeWidth={1.9} aria-hidden="true" />
                </button>
                {showNotifications && (
                  <NotificationsPanel
                    budgetTarget={overview.budgetTarget}
                    monthlySpend={overview.monthlySpend}
                    spendingByCategory={overview.spendingByCategory}
                    upcomingBills={overview.upcomingBills}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>

              {/* add */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-label="Add"
                  aria-haspopup="menu"
                  aria-expanded={showAddMenu}
                  onClick={() => setShowAddMenu((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 38,
                    padding: "0 17px 0 14px",
                    borderRadius: 999,
                    border: "none",
                    background: "var(--bk-accent)",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: `0 1px 2px oklch(40% 0.1 ${hueOf(accent)} / 0.3)`,
                  }}
                >
                  <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
                  Add
                </button>
                {showAddMenu && (
                  <>
                    <div
                      onClick={() => setShowAddMenu(false)}
                      style={{ position: "fixed", inset: 0, zIndex: 40 }}
                      aria-hidden="true"
                    />
                    <div
                      role="menu"
                      style={{
                        position: "absolute",
                        top: 46,
                        right: 0,
                        zIndex: 50,
                        minWidth: 196,
                        padding: 6,
                        borderRadius: 14,
                        background: "var(--color-bk-surface)",
                        border: "1px solid var(--color-bk-line)",
                        boxShadow: "0 12px 32px oklch(20% 0.02 80 / 0.14)",
                      }}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAddMenu(false);
                          setShowAdd(true);
                        }}
                        className="bk-menu-item"
                      >
                        <Plus size={15} strokeWidth={2} aria-hidden="true" />
                        New transaction
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAddMenu(false);
                          setShowImport(true);
                        }}
                        className="bk-menu-item"
                      >
                        <List size={15} strokeWidth={2} aria-hidden="true" />
                        Import statement
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* scroll canvas */}
          <div
            className="bk-scroll"
            style={{ flex: 1, overflowY: "auto", padding: 34 }}
            key={view}
          >
            {renderPage()}
          </div>
        </main>

      {/* CRUD modals — styled to the Bulga system, wired to refetch on success */}
      <AddTransactionModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          setShowAdd(false);
          refresh();
        }}
      />
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => {
          setShowImport(false);
          refresh();
        }}
      />
      <EditTransactionModal
        open={!!editTx}
        transaction={editTx}
        onClose={() => setEditTx(null)}
        onUpdated={() => {
          setEditTx(null);
          refresh();
        }}
      />
      <AddGoalModal
        open={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onAdded={() => {
          setShowAddGoal(false);
          refresh();
        }}
      />
      <EditGoalModal
        open={!!editGoal}
        goal={editGoal}
        onClose={() => setEditGoal(null)}
        onUpdated={() => {
          setEditGoal(null);
          refresh();
        }}
      />
      <AddAccountModal
        open={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAdded={() => {
          setShowAddAccount(false);
          refresh();
        }}
      />
      <EditAccountModal
        open={!!editAccount}
        account={editAccount}
        onClose={() => setEditAccount(null)}
        onUpdated={() => {
          setEditAccount(null);
          refresh();
        }}
      />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        accent={accent}
        onAccentChange={changeAccent}
        user={{
          name: userName ?? "",
          email: session?.user?.email ?? "",
          monthlyIncome: overview.monthlyIncome,
          currency: overview.currency,
          budgetTarget: overview.budgetTarget,
        }}
      />
    </div>
  );
}
