"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Landmark,
  RefreshCw,
  ClipboardCheck,
  Plus,
  X,
  Upload,
  FileText,
  Loader2,
  Brain,
  PenLine,
  Check,
} from "lucide-react";

type AccountEntry = { name: string; type: string; balance: string };
type RecurringEntry = { name: string; amount: string; cycle: string; dueDay?: number };
type Mode = "choose" | "manual" | "auto";

const ACCOUNT_TYPES = [
  "Chequing", "Savings", "TFSA", "RRSP", "FHSA", "Credit Card", "Investment", "Other",
];
const CURRENCIES = ["CAD", "USD", "EUR", "GBP"];

const MANUAL_STEPS = [
  { label: "Income", icon: DollarSign },
  { label: "Budget", icon: ClipboardCheck },
  { label: "Accounts", icon: Landmark },
  { label: "Recurring", icon: RefreshCw },
  { label: "Review", icon: ClipboardCheck },
];

const AUTO_STEPS = [
  { label: "Upload", icon: Upload },
  { label: "Analyzing", icon: Brain },
  { label: "Review", icon: ClipboardCheck },
];

export function OnboardingWizard({ userName }: { userName: string }) {
  const { update } = useSession();
  const [mode, setMode] = useState<Mode>("choose");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Manual fields
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [monthlySavings, setMonthlySavings] = useState("");
  const budgetTarget = monthlyIncome && monthlySavings
    ? String(Number(monthlyIncome) - Number(monthlySavings))
    : "";
  const [accounts, setAccounts] = useState<AccountEntry[]>([
    { name: "", type: "Chequing", balance: "" },
  ]);
  const [recurring, setRecurring] = useState<RecurringEntry[]>([
    { name: "", amount: "", cycle: "Monthly" },
  ]);

  // Auto fields
  const [files, setFiles] = useState<File[]>([]);
  const [autoAnalysis, setAutoAnalysis] = useState<{
    accounts: { name: string; type: string; balance: number }[];
    recurringExpenses: { name: string; amount: number; cycle: string }[];
    monthlyIncome: number;
    monthlySpend: number;
    budgetTarget: number;
    transactions: { name: string; amount: number; date: string; category: string; isRecurring: boolean }[];
    fileCount: number;
    transactionCount: number;
  } | null>(null);

  // --- Helpers ---
  const canAdvance = () => {
    if (mode === "manual") {
      switch (step) {
        case 0: return Number(monthlyIncome) > 0;
        case 1: return Number(monthlySavings) > 0;
        default: return true;
      }
    }
    if (mode === "auto") {
      return step === 0 ? files.length > 0 : true;
    }
    return false;
  };

  const addAccount = () => setAccounts([...accounts, { name: "", type: "Chequing", balance: "" }]);
  const removeAccount = (i: number) => setAccounts(accounts.filter((_, idx) => idx !== i));
  const updateAccount = (i: number, field: keyof AccountEntry, value: string) => {
    const updated = [...accounts];
    updated[i] = { ...updated[i], [field]: value };
    setAccounts(updated);
  };
  const addRecurring = () => setRecurring([...recurring, { name: "", amount: "", cycle: "Monthly" }]);
  const removeRecurring = (i: number) => setRecurring(recurring.filter((_, idx) => idx !== i));
  const updateRecurring = (i: number, field: keyof RecurringEntry, value: string) => {
    const updated = [...recurring];
    updated[i] = { ...updated[i], [field]: value };
    setRecurring(updated);
  };

  const fmtCurrency = (value: string | number) => {
    const num = Number(value);
    if (!num) return "$0";
    return new Intl.NumberFormat("en-CA", { style: "currency", currency, minimumFractionDigits: 0 }).format(num);
  };

  // --- Auto: upload & analyze ---
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".csv") || f.name.endsWith(".pdf")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (i: number) => setFiles(files.filter((_, idx) => idx !== i));

  const handleAutoAnalyze = async () => {
    setStep(1); // "Analyzing" step
    setError("");

    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);
      formData.append("currency", currency);

      const res = await fetch("/api/onboarding/auto", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Analysis failed");
        setStep(0);
        return;
      }

      const data = await res.json();
      setAutoAnalysis(data.analysis);

      // Pre-fill editable fields from analysis
      setMonthlyIncome(String(data.analysis.monthlyIncome));
      const estSavings = data.analysis.monthlyIncome - data.analysis.budgetTarget;
      setMonthlySavings(String(Math.max(0, Math.round(estSavings))));
      setAccounts(
        data.analysis.accounts.length > 0
          ? data.analysis.accounts.map((a: { name: string; type: string; balance: number }) => ({
              name: a.name,
              type: ACCOUNT_TYPES.find((t) => t.toLowerCase().replace(" ", "-") === a.type) || "Other",
              balance: String(a.balance),
            }))
          : [{ name: "", type: "Chequing", balance: "" }]
      );
      setRecurring(
        data.analysis.recurringExpenses.length > 0
          ? data.analysis.recurringExpenses.map((r: { name: string; amount: number; cycle: string; dueDay?: number }) => ({
              name: r.name,
              amount: String(r.amount),
              cycle: r.cycle,
              dueDay: r.dueDay,
            }))
          : [{ name: "", amount: "", cycle: "Monthly" }]
      );

      setStep(2); // "Review" step
    } catch {
      setError("Failed to analyze files. Please try again.");
      setStep(0);
    }
  };

  // --- Submit (shared for both modes) ---
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const validAccounts = accounts.filter((a) => a.name && a.balance);
      const validRecurring = recurring.filter((r) => r.name && r.amount);

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: Number(monthlyIncome),
          currency,
          budgetTarget: Number(budgetTarget),
          accounts: validAccounts.map((a) => ({
            name: a.name,
            type: a.type.toLowerCase().replace(" ", "-"),
            balance: Number(a.balance),
          })),
          recurringExpenses: validRecurring.map((r) => ({
            name: r.name,
            amount: Number(r.amount),
            cycle: r.cycle,
            dueDay: r.dueDay,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // If auto mode, also import the transactions
      if (mode === "auto" && autoAnalysis?.transactions?.length) {
        await fetch("/api/import/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statementId: null,
            transactions: autoAnalysis.transactions.map((t) => ({
              name: t.name,
              amount: t.amount,
              date: t.date,
            })),
          }),
        });
      }

      await update({ onboardingDone: true });
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // --- Mode chooser ---
  if (mode === "choose") {
    return (
      <>
        <GlassCard className="hover:translate-y-0">
          <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Welcome, {userName.split(" ")[0]}!</h2>
          <p className="text-sm text-muted-text mb-6">How would you like to set up your budget?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setMode("auto")}
              className="flex flex-col items-center gap-3 p-7 rounded-2xl border-2 border-[oklch(90%_0.006_80)] bg-[oklch(100%_0_0/0.4)] hover:border-sage hover:-translate-y-1 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-sage-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-sage" />
              </div>
              <div>
                <div className="text-sm font-semibold text-bulga-text">Automatic</div>
                <div className="text-[11px] text-muted-text mt-1 leading-relaxed">
                  Upload bank statements and let AI extract everything
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("manual")}
              className="flex flex-col items-center gap-3 p-7 rounded-2xl border-2 border-[oklch(90%_0.006_80)] bg-[oklch(100%_0_0/0.4)] hover:border-sage hover:-translate-y-1 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-light flex items-center justify-center group-hover:scale-110 transition-transform">
                <PenLine className="w-6 h-6 text-slate-brand" />
              </div>
              <div>
                <div className="text-sm font-semibold text-bulga-text">Manual</div>
                <div className="text-[11px] text-muted-text mt-1 leading-relaxed">
                  Enter your income, accounts, and expenses by hand
                </div>
              </div>
            </button>
          </div>
        </GlassCard>
      </>
    );
  }

  // --- Determine steps based on mode ---
  const steps = mode === "manual" ? MANUAL_STEPS : AUTO_STEPS;
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps - 1;

  return (
    <>
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8 sm:mb-10">
        <button
          onClick={() => { setMode("choose"); setStep(0); }}
          className="text-xs text-muted-text hover:text-bulga-text mr-2"
        >
          ← Change mode
        </button>
        {steps.map((s, i) => (
          <button
            key={s.label}
            onClick={() => i < step && setStep(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === step
                ? "bg-bulga-text text-white"
                : i < step
                ? "text-sage cursor-pointer"
                : "text-muted-text"
            }`}
          >
            <s.icon className="w-3 h-3" />
            {s.label}
          </button>
        ))}
      </div>

      <GlassCard className="hover:translate-y-0">
        {/* ====== MANUAL MODE ====== */}
        {mode === "manual" && (
          <>
            {/* Step 1: Income */}
            {step === 0 && (
              <div className="space-y-6 sm:space-y-7" key="income">
                <div>
                  <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Monthly Income</h2>
                  <p className="text-sm text-muted-text">What&apos;s your monthly take-home income?</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">Monthly Income</label>
                  <Input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="5000" min="0" step="100" className="h-10 rounded-xl bg-[oklch(100%_0_0/0.4)] border-[oklch(90%_0.006_80)]" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-10 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)] px-3 text-sm font-sans outline-none">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Budget */}
            {step === 1 && (
              <div className="space-y-6 sm:space-y-7" key="budget">
                <div>
                  <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Savings Goal</h2>
                  <p className="text-sm text-muted-text">How much do you want to save each month?</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">Monthly Savings</label>
                  <Input type="number" value={monthlySavings} onChange={(e) => setMonthlySavings(e.target.value)} placeholder={monthlyIncome ? String(Math.round(Number(monthlyIncome) * 0.2)) : "1000"} min="0" step="100" className="h-10 rounded-xl bg-[oklch(100%_0_0/0.4)] border-[oklch(90%_0.006_80)]" />
                  {monthlyIncome && Number(monthlySavings) > 0 && (
                    <p className="text-xs text-muted-text mt-1.5">
                      That&apos;s {Math.round((Number(monthlySavings) / Number(monthlyIncome)) * 100)}% of your income — leaving {fmtCurrency(Number(monthlyIncome) - Number(monthlySavings))}/mo to spend
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Accounts */}
            {step === 2 && (
              <div className="space-y-6 sm:space-y-7" key="accounts">
                <div>
                  <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Your Accounts</h2>
                  <p className="text-sm text-muted-text">Add your bank accounts and credit cards.</p>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {accounts.map((acc, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
                      <div className="flex-1 space-y-2">
                        <Input value={acc.name} onChange={(e) => updateAccount(i, "name", e.target.value)} placeholder="Account name" className="h-8 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-sm" />
                        <div className="flex gap-2">
                          <select value={acc.type} onChange={(e) => updateAccount(i, "type", e.target.value)} className="flex-1 h-8 rounded-lg bg-transparent border border-[oklch(90%_0.006_80)] px-2 text-sm font-sans outline-none">
                            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <Input type="number" value={acc.balance} onChange={(e) => updateAccount(i, "balance", e.target.value)} placeholder="Balance" className="flex-1 h-8 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-sm" />
                        </div>
                      </div>
                      {accounts.length > 1 && (
                        <button onClick={() => removeAccount(i)} className="mt-1 text-muted-text hover:text-terra transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addAccount} className="flex items-center gap-1.5 text-sm text-sage font-medium hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add another account
                </button>
              </div>
            )}

            {/* Step 4: Recurring */}
            {step === 3 && (
              <div className="space-y-6 sm:space-y-7" key="recurring">
                <div>
                  <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Recurring Expenses</h2>
                  <p className="text-sm text-muted-text">Add known recurring expenses like rent, subscriptions, and insurance.</p>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {recurring.map((rec, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
                      <div className="flex-1 space-y-2">
                        <Input value={rec.name} onChange={(e) => updateRecurring(i, "name", e.target.value)} placeholder="e.g. Rent, Netflix" className="h-8 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-sm" />
                        <div className="flex gap-2">
                          <Input type="number" value={rec.amount} onChange={(e) => updateRecurring(i, "amount", e.target.value)} placeholder="Amount" className="flex-1 h-8 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-sm" />
                          <select value={rec.cycle} onChange={(e) => updateRecurring(i, "cycle", e.target.value)} className="flex-1 h-8 rounded-lg bg-transparent border border-[oklch(90%_0.006_80)] px-2 text-sm font-sans outline-none">
                            <option value="Monthly">Monthly</option>
                            <option value="Annual">Annual</option>
                            <option value="Weekly">Weekly</option>
                          </select>
                        </div>
                      </div>
                      {recurring.length > 1 && (
                        <button onClick={() => removeRecurring(i)} className="mt-1 text-muted-text hover:text-terra transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addRecurring} className="flex items-center gap-1.5 text-sm text-sage font-medium hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add another expense
                </button>
              </div>
            )}

            {/* Step 5: Review (manual) */}
            {step === 4 && (
              <ReviewStep
                monthlyIncome={monthlyIncome}
                monthlySavings={monthlySavings}
                budgetTarget={budgetTarget}
                currency={currency}
                accounts={accounts}
                recurring={recurring}
                fmtCurrency={fmtCurrency}
                error={error}
              />
            )}
          </>
        )}

        {/* ====== AUTO MODE ====== */}
        {mode === "auto" && (
          <>
            {/* Step 1: Upload */}
            {step === 0 && (
              <div className="space-y-6 sm:space-y-7" key="upload">
                <div>
                  <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Upload Statements</h2>
                  <p className="text-sm text-muted-text">
                    Drop your bank statements (CSV or PDF). Upload as many as you like — AI will extract accounts, recurring expenses, and categorize transactions.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-10 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)] px-3 text-sm font-sans outline-none">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-[oklch(90%_0.006_80)] rounded-2xl p-8 text-center cursor-pointer hover:border-sage transition-colors"
                  onClick={() => document.getElementById("auto-file-input")?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-text mb-3" />
                  <p className="text-sm font-medium text-bulga-text">Drop CSV or PDF files here</p>
                  <p className="text-xs text-muted-text mt-1">or click to browse — upload multiple files</p>
                  <input
                    id="auto-file-input"
                    type="file"
                    accept=".csv,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
                        <FileText className="w-4 h-4 text-sage shrink-0" />
                        <span className="text-sm flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-muted-text">{(f.size / 1024).toFixed(1)} KB</span>
                        <button onClick={() => removeFile(i)} className="text-muted-text hover:text-terra">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && <p className="text-sm text-terra font-medium">{error}</p>}
              </div>
            )}

            {/* Step 2: Analyzing */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center py-12" key="analyzing">
                <Loader2 className="w-10 h-10 text-sage animate-spin mb-4" />
                <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Analyzing your statements...</h2>
                <p className="text-sm text-muted-text text-center max-w-sm">
                  AI is reading {files.length} file{files.length > 1 ? "s" : ""} to extract your accounts, recurring expenses, income, and transactions. This may take a minute.
                </p>
              </div>
            )}

            {/* Step 3: Review (auto) */}
            {step === 2 && autoAnalysis && (
              <div className="space-y-6 sm:space-y-7" key="auto-review">
                <div>
                  <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Here&apos;s what we found</h2>
                  <p className="text-sm text-muted-text">
                    <Check className="w-3.5 h-3.5 inline text-sage mr-1" />
                    {autoAnalysis.transactionCount} transactions from {autoAnalysis.fileCount} file{autoAnalysis.fileCount > 1 ? "s" : ""}. Review and edit below.
                  </p>
                </div>

                {/* Editable income & budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">Monthly Income</label>
                    <Input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="h-9 rounded-xl bg-[oklch(100%_0_0/0.4)] border-[oklch(90%_0.006_80)] text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">Monthly Savings</label>
                    <Input type="number" value={monthlySavings} onChange={(e) => setMonthlySavings(e.target.value)} className="h-9 rounded-xl bg-[oklch(100%_0_0/0.4)] border-[oklch(90%_0.006_80)] text-sm" />
                  </div>
                </div>

                {/* Accounts */}
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-2">
                    Accounts ({accounts.filter((a) => a.name).length})
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {accounts.map((acc, i) => (
                      <div key={i} className="flex gap-2 items-center p-2.5 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
                        <Input value={acc.name} onChange={(e) => updateAccount(i, "name", e.target.value)} className="flex-1 h-7 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-xs" />
                        <select value={acc.type} onChange={(e) => updateAccount(i, "type", e.target.value)} className="h-7 rounded-lg bg-transparent border border-[oklch(90%_0.006_80)] px-1.5 text-xs font-sans outline-none">
                          {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Input type="number" value={acc.balance} onChange={(e) => updateAccount(i, "balance", e.target.value)} placeholder="Balance" className="w-24 h-7 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-xs" />
                        {accounts.length > 1 && (
                          <button onClick={() => removeAccount(i)} className="text-muted-text hover:text-terra"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addAccount} className="flex items-center gap-1 text-xs text-sage font-medium hover:underline mt-1.5">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {/* Recurring */}
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-2">
                    Recurring Expenses ({recurring.filter((r) => r.name).length})
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {recurring.map((rec, i) => (
                      <div key={i} className="flex gap-2 items-center p-2.5 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
                        <Input value={rec.name} onChange={(e) => updateRecurring(i, "name", e.target.value)} className="flex-1 h-7 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-xs" />
                        <Input type="number" value={rec.amount} onChange={(e) => updateRecurring(i, "amount", e.target.value)} placeholder="$" className="w-20 h-7 rounded-lg bg-transparent border-[oklch(90%_0.006_80)] text-xs" />
                        <select value={rec.cycle} onChange={(e) => updateRecurring(i, "cycle", e.target.value)} className="h-7 rounded-lg bg-transparent border border-[oklch(90%_0.006_80)] px-1.5 text-xs font-sans outline-none">
                          <option value="Monthly">Monthly</option>
                          <option value="Annual">Annual</option>
                          <option value="Weekly">Weekly</option>
                        </select>
                        {recurring.length > 1 && (
                          <button onClick={() => removeRecurring(i)} className="text-muted-text hover:text-terra"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addRecurring} className="flex items-center gap-1 text-xs text-sage font-medium hover:underline mt-1.5">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {error && <p className="text-sm text-terra font-medium">{error}</p>}
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 gap-3">
          {step > 0 && !(mode === "auto" && step === 1) ? (
            <Button
              onClick={() => setStep(step - 1)}
              className="h-10 px-5 rounded-xl bg-[oklch(100%_0_0/0.4)] text-bulga-text border border-[oklch(90%_0.006_80)] font-medium text-sm hover:bg-[oklch(100%_0_0/0.4)]"
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {mode === "auto" && step === 0 ? (
            <Button
              onClick={handleAutoAnalyze}
              disabled={files.length === 0}
              className="h-10 px-5 rounded-xl bg-sage text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Brain className="w-4 h-4 mr-2" />
              Analyze {files.length} file{files.length !== 1 ? "s" : ""}
            </Button>
          ) : mode === "auto" && step === 1 ? (
            <div />
          ) : !isLastStep ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="h-10 px-5 rounded-xl bg-bulga-text text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="h-10 px-5 rounded-xl bg-sage text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {loading ? "Setting up..." : "Get Started"}
            </Button>
          )}
        </div>
      </GlassCard>
    </>
  );
}

// --- Review step (shared UI) ---
function ReviewStep({
  monthlyIncome, monthlySavings, budgetTarget, currency, accounts, recurring, fmtCurrency, error,
}: {
  monthlyIncome: string; monthlySavings: string; budgetTarget: string; currency: string;
  accounts: AccountEntry[]; recurring: RecurringEntry[];
  fmtCurrency: (v: string | number) => string; error: string;
}) {
  return (
    <div className="space-y-6 sm:space-y-7" key="review">
      <div>
        <h2 className="font-serif text-2xl sm:text-[28px] tracking-[-0.02em] leading-[1.05] mb-2">Looking Good!</h2>
        <p className="text-sm text-muted-text">Here&apos;s a summary. You can go back to edit anything.</p>
      </div>
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
          <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1">Monthly Income</div>
          <div className="font-serif text-lg">{fmtCurrency(monthlyIncome)} {currency}</div>
        </div>
        <div className="p-3 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
          <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1">Monthly Savings</div>
          <div className="font-serif text-lg">{fmtCurrency(monthlySavings)}/mo <span className="text-sm text-muted-text font-sans font-normal">({Math.round((Number(monthlySavings) / Number(monthlyIncome)) * 100) || 0}% of income)</span></div>
        </div>
        <div className="p-3 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
          <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1">Spending Budget</div>
          <div className="font-serif text-lg">{fmtCurrency(budgetTarget)}/mo</div>
        </div>
        {accounts.some((a) => a.name) && (
          <div className="p-3 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
            <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1">Accounts ({accounts.filter((a) => a.name).length})</div>
            {accounts.filter((a) => a.name).map((a, i) => (
              <div key={i} className="flex justify-between text-sm py-0.5">
                <span>{a.name} <span className="text-muted-text">· {a.type}</span></span>
                <span className="font-medium">{fmtCurrency(a.balance)}</span>
              </div>
            ))}
          </div>
        )}
        {recurring.some((r) => r.name) && (
          <div className="p-3 rounded-xl bg-[oklch(100%_0_0/0.4)] border border-[oklch(90%_0.006_80)]">
            <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1">Recurring Expenses ({recurring.filter((r) => r.name).length})</div>
            {recurring.filter((r) => r.name).map((r, i) => (
              <div key={i} className="flex justify-between text-sm py-0.5">
                <span>{r.name} <span className="text-muted-text">· {r.cycle}</span></span>
                <span className="font-medium">{fmtCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-terra font-medium">{error}</p>}
    </div>
  );
}
