"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TABS, type Tab } from "@/lib/types";
import type { DashboardOverview, SpendCategory, GoalView, TransactionView, SubscriptionView, AccountView, InsightView } from "@/lib/types";
import { Overview } from "./overview";
import { Spending } from "./spending";
import { Goals } from "./goals";
import { Transactions } from "./transactions";
import { Subscriptions } from "./subscriptions";
import { Accounts } from "./accounts";
import { Insights } from "./insights";
import { AddTransactionModal } from "./add-modal";
import { ImportModal } from "./import-modal";
import { Bell, Settings, Plus, Upload, LogOut, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationsPanel } from "./notifications-panel";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EMPTY_OVERVIEW: DashboardOverview = {
  netWorth: 0, netWorthChange: 0, monthlyIncome: 0, monthlySpend: 0,
  monthlySurplus: 0,
  budgetTarget: 0, savingsRate: 0, savedAmount: 0, currency: "CAD",
  spendingByCategory: [], upcomingBills: [],
  incomeVsExpense: { months: [], income: [], expenses: [] },
  netWorthTrend: [], goals: [], recentTransactions: [],
};

interface InitialData {
  overview: DashboardOverview;
  spending: SpendCategory[];
  goals: GoalView[];
  transactions: { transactions: TransactionView[]; total: number; totalPages: number };
  subscriptions: SubscriptionView[];
  accounts: AccountView[];
  insights: InsightView[];
  month: number;
  year: number;
}

async function fetchTab(tab: string, month: number, year: number, extra?: Record<string, string>) {
  const params = new URLSearchParams({ tab: tab.toLowerCase(), month: String(month), year: String(year), ...extra });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`/api/dashboard?${params}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to fetch ${tab}: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function DashboardShell({ initialData }: { initialData: InitialData }) {
  const { data: session } = useSession();
  const [month, setMonth] = useState(initialData.month);
  const [year, setYear] = useState(initialData.year);
  const [tab, setTab] = useState<Tab>("Overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const fabMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Data states — initialized from server
  const [overview, setOverview] = useState<DashboardOverview>(initialData.overview);
  const [spending, setSpending] = useState<SpendCategory[]>(initialData.spending);
  const [goals, setGoals] = useState<GoalView[]>(initialData.goals);
  const [transactions, setTransactions] = useState(initialData.transactions);
  const [subscriptions, setSubscriptions] = useState<SubscriptionView[]>(initialData.subscriptions);
  const [accounts, setAccounts] = useState<AccountView[]>(initialData.accounts);
  const [insights, setInsights] = useState<InsightView[]>(initialData.insights);
  const [loading, setLoading] = useState(false);

  // Tab nav refs
  const navRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Map<Tab, HTMLButtonElement>>(new Map());
  const [pill, setPill] = useState({ left: 0, width: 0 });

  const updatePill = useCallback((t: Tab) => {
    const btn = btnRefs.current.get(t);
    const nav = navRef.current;
    if (!btn || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPill({ left: btnRect.left - navRect.left, width: btnRect.width });
  }, []);

  useEffect(() => { updatePill(tab); }, [tab, updatePill]);
  useEffect(() => {
    const onResize = () => updatePill(tab);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [tab, updatePill]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
      if (fabMenuRef.current && !fabMenuRef.current.contains(target)) {
        setShowFabMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Refresh a specific tab's data (called after edits, imports, etc.)
  const refreshTab = useCallback(async (activeTab: Tab) => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "Overview":
          setOverview(await fetchTab("overview", month, year));
          break;
        case "Spending":
          setSpending(await fetchTab("spending", month, year));
          break;
        case "Goals":
          setGoals(await fetchTab("goals", month, year));
          break;
        case "Transactions":
          setTransactions(await fetchTab("transactions", month, year));
          break;
        case "Subscriptions":
          setSubscriptions(await fetchTab("subscriptions", month, year));
          break;
        case "Accounts":
          setAccounts(await fetchTab("accounts", month, year));
          break;
        case "Insights":
          setInsights(await fetchTab("insights", month, year));
          break;
      }
    } catch (err) {
      console.error("Failed to refresh tab:", err);
    }
    setLoading(false);
  }, [month, year]);

  // When month/year changes, reload current tab
  useEffect(() => {
    // Don't fetch on initial mount — we have server data
    if (month === initialData.month && year === initialData.year) return;
    refreshTab(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const refreshCurrentTab = () => refreshTab(tab);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    setShowMonthPicker(false);
  };

  // When switching tabs, fetch if we haven't loaded that tab for the current month/year
  const handleTabChange = async (newTab: Tab) => {
    setTab(newTab);
    // Always refresh when switching tabs to get fresh data
    refreshTab(newTab);
  };

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  const renderTab = () => {
    switch (tab) {
      case "Overview":
        return (
          <Overview
            data={overview}
            month={month}
            year={year}
            insights={insights}
            onShowInsights={() => handleTabChange("Insights")}
            onShowTransactions={() => handleTabChange("Transactions")}
            onRefresh={refreshCurrentTab}
          />
        );
      case "Spending":
        return <Spending data={spending} />;
      case "Goals":
        return <Goals data={goals} onRefresh={refreshCurrentTab} />;
      case "Transactions":
        return (
          <Transactions
            data={transactions}
            spending={spending}
            onImport={() => setShowImportModal(true)}
            onRefresh={refreshCurrentTab}
            month={month}
            year={year}
          />
        );
      case "Subscriptions":
        return <Subscriptions data={subscriptions} />;
      case "Accounts":
        return <Accounts data={accounts} onRefresh={refreshCurrentTab} />;
      case "Insights":
        return <Insights data={insights} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative z-[1] h-screen flex flex-col">

      {/* Top Bar */}
      <div className="relative flex items-center justify-between px-4 sm:px-7 py-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <div className="relative lg:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu((v) => !v)}
              className="w-[38px] h-[38px] rounded-full bg-[oklch(100%_0_0/0.36)] border border-[oklch(100%_0_0/0.58)] backdrop-blur-[28px] backdrop-saturate-[1.6] flex items-center justify-center cursor-pointer shadow-[0_2px_0_oklch(100%_0_0/0.6)_inset,0_4px_16px_oklch(16%_0.02_260/0.09)] transition-all duration-250 hover:bg-[oklch(100%_0_0/0.5)]"
              aria-label="Navigation menu"
              aria-haspopup="menu"
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Mobile nav dropdown */}
            <div
              role="menu"
              className={`absolute left-0 top-full mt-2 w-[200px] origin-top-left p-1.5 rounded-2xl bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_12px_48px_oklch(16%_0.02_260/0.14),0_4px_16px_oklch(16%_0.02_260/0.08)] transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-50 ${
                showMobileMenu
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              {TABS.map((t) => (
                <button
                  key={t}
                  role="menuitem"
                  onClick={() => { handleTabChange(t); setShowMobileMenu(false); }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-bulga-text text-white"
                      : "text-bulga-text hover:bg-[oklch(100%_0_0/0.5)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <a href="/dashboard" className="font-serif text-xl tracking-[-0.02em] no-underline text-bulga-text">
            Bulg<em className="not-italic text-sage">a</em>
          </a>
        </div>

        {/* Pill Nav — absolutely centered, hidden on mobile */}
        <div
          ref={navRef}
          className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center bg-[oklch(100%_0_0/0.36)] backdrop-blur-[28px] backdrop-saturate-[1.6] border border-[oklch(100%_0_0/0.58)] rounded-full px-[5px] py-[5px] shadow-[0_2px_0_oklch(100%_0_0/0.6)_inset,0_8px_32px_oklch(16%_0.02_260/0.1),0_2px_8px_oklch(16%_0.02_260/0.06)] gap-0.5"
        >
          <div
            className="absolute top-[5px] bottom-[5px] rounded-full bg-bulga-text shadow-[0_2px_12px_oklch(16%_0.02_260/0.2)] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            style={{ left: pill.left, width: pill.width }}
          />
          {TABS.map((t) => (
            <button
              key={t}
              ref={(el) => { if (el) btnRefs.current.set(t, el); }}
              onClick={() => handleTabChange(t)}
              className={`relative z-[1] text-[13px] font-medium px-[18px] py-2 rounded-full border-none font-sans whitespace-nowrap transition-colors duration-250 cursor-pointer ${
                tab === t
                  ? "text-white"
                  : "text-muted-text bg-transparent hover:text-bulga-text hover:bg-[oklch(100%_0_0/0.1)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Month selector */}
          <div className="relative">
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center gap-2 text-[13px] font-semibold text-muted-text cursor-pointer px-3.5 py-1.5 rounded-full border border-[oklch(100%_0_0/0.58)] bg-[oklch(100%_0_0/0.36)] backdrop-blur-[28px] backdrop-saturate-[1.6] shadow-[0_2px_0_oklch(100%_0_0/0.6)_inset,0_4px_16px_oklch(16%_0.02_260/0.08)] transition-colors hover:bg-[oklch(100%_0_0/0.5)]"
            >
              {MONTH_NAMES[month - 1]} {year} ▾
            </button>
            {showMonthPicker && (
              <div className="absolute top-full right-0 mt-2 bg-[oklch(100%_0_0/0.5)] backdrop-blur-[40px] backdrop-saturate-[1.8] border border-[oklch(100%_0_0/0.6)] rounded-2xl shadow-[0_2px_0_oklch(100%_0_0/0.7)_inset,0_12px_48px_oklch(16%_0.02_260/0.14),0_2px_8px_oklch(16%_0.02_260/0.07)] p-3 z-50 w-[200px]">
                <div className="flex justify-between items-center mb-2 px-1">
                  <button onClick={() => handleMonthChange(month, year - 1)} className="text-xs text-muted-text hover:text-bulga-text">&larr;</button>
                  <span className="text-sm font-semibold">{year}</span>
                  <button onClick={() => handleMonthChange(month, year + 1)} className="text-xs text-muted-text hover:text-bulga-text">&rarr;</button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_NAMES.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => handleMonthChange(i + 1, year)}
                      className={`text-xs py-1.5 rounded-lg transition-colors ${
                        i + 1 === month ? "bg-bulga-text text-white" : "hover:bg-[oklch(100%_0_0/0.12)]"
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-[38px] h-[38px] rounded-full bg-[oklch(100%_0_0/0.36)] border border-[oklch(100%_0_0/0.58)] backdrop-blur-[28px] backdrop-saturate-[1.6] flex items-center justify-center cursor-pointer shadow-[0_2px_0_oklch(100%_0_0/0.6)_inset,0_4px_16px_oklch(16%_0.02_260/0.09)] transition-all duration-250 hover:bg-[oklch(100%_0_0/0.5)] hover:-translate-y-px hover:shadow-[0_2px_0_oklch(100%_0_0/0.7)_inset,0_8px_24px_oklch(16%_0.02_260/0.12)]"
            >
              <Bell className="w-4 h-4" />
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

          {/* Profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[13px] font-bold text-white cursor-pointer border-2 border-white shadow-[0_4px_24px_oklch(16%_0.02_260/0.07),0_1px_4px_oklch(16%_0.02_260/0.04)] transition-transform duration-200 hover:scale-[1.06]"
              style={{ background: "linear-gradient(135deg, oklch(60% 0.09 155), oklch(50% 0.07 245))" }}
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              title={session?.user?.name || ""}
            >
              {initials}
            </button>

            <div
              role="menu"
              className={`absolute right-0 top-full mt-2 w-[180px] origin-top-right p-1.5 rounded-2xl bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_12px_48px_oklch(16%_0.02_260/0.14),0_4px_16px_oklch(16%_0.02_260/0.08)] transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-50 ${
                showProfileMenu
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              <a
                href="/settings"
                role="menuitem"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-bulga-text hover:bg-[oklch(100%_0_0/0.5)] transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </a>
              <button
                role="menuitem"
                onClick={() => { setShowProfileMenu(false); signOut({ callbackUrl: "/login" }); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-terra hover:bg-[oklch(100%_0_0/0.5)] transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-7 pb-7 pt-2 custom-scrollbar" key={`${tab}-${month}-${year}`}>
        {loading ? (
          <div className="tab-content flex items-center justify-center py-20">
            <div className="text-muted-text text-sm">Loading...</div>
          </div>
        ) : (
          renderTab()
        )}
      </div>

      {/* FAB speed-dial */}
      <div
        ref={fabMenuRef}
        className="fixed bottom-7 right-7 z-50 flex flex-col items-end gap-3"
      >
        {/* Import action */}
        <div
          className={`flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] origin-bottom-right ${
            showFabMenu
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-3 scale-90 pointer-events-none"
          }`}
          style={{ transitionDelay: showFabMenu ? "120ms" : "0ms" }}
        >
          <span className="text-[12px] font-semibold text-bulga-text bg-[oklch(100%_0_0/0.62)] backdrop-blur-[20px] px-3 py-1.5 rounded-full border border-[oklch(100%_0_0/0.6)] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_4px_12px_oklch(16%_0.02_260/0.08)]">
            Import
          </span>
          <button
            onClick={() => { setShowFabMenu(false); setShowImportModal(true); }}
            className="w-11 h-11 rounded-full bg-[oklch(100%_0_0/0.62)] backdrop-blur-[20px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] text-bulga-text flex items-center justify-center cursor-pointer shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_8px_24px_oklch(16%_0.02_260/0.12)] hover:scale-110 hover:bg-[oklch(100%_0_0/0.78)] transition-all duration-200"
            title="Import statement"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* Add Transaction action */}
        <div
          className={`flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] origin-bottom-right ${
            showFabMenu
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-3 scale-90 pointer-events-none"
          }`}
          style={{ transitionDelay: showFabMenu ? "60ms" : "0ms" }}
        >
          <span className="text-[12px] font-semibold text-bulga-text bg-[oklch(100%_0_0/0.62)] backdrop-blur-[20px] px-3 py-1.5 rounded-full border border-[oklch(100%_0_0/0.6)] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_4px_12px_oklch(16%_0.02_260/0.08)]">
            Add Transaction
          </span>
          <button
            onClick={() => { setShowFabMenu(false); setShowAddModal(true); }}
            className="w-11 h-11 rounded-full bg-[oklch(100%_0_0/0.62)] backdrop-blur-[20px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] text-bulga-text flex items-center justify-center cursor-pointer shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_8px_24px_oklch(16%_0.02_260/0.12)] hover:scale-110 hover:bg-[oklch(100%_0_0/0.78)] transition-all duration-200"
            title="Add transaction"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setShowFabMenu((v) => !v)}
          className="w-[52px] h-[52px] rounded-full bg-bulga-text text-white border-none cursor-pointer flex items-center justify-center shadow-[0_12px_48px_oklch(16%_0.02_260/0.1),0_4px_12px_oklch(16%_0.02_260/0.05)] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:scale-[1.08] hover:-translate-y-0.5 hover:shadow-[0_24px_80px_oklch(16%_0.02_260/0.14),0_8px_24px_oklch(16%_0.02_260/0.06)]"
          aria-haspopup="menu"
          aria-expanded={showFabMenu}
          title={showFabMenu ? "Close" : "Quick actions"}
        >
          <Plus
            className={`w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              showFabMenu ? "rotate-45" : "rotate-0"
            }`}
          />
        </button>
      </div>

      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={refreshCurrentTab}
      />
      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={refreshCurrentTab}
      />
    </div>
  );
}
