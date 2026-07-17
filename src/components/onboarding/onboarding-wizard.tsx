"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextInput, SelectInput, DateInput } from "@/components/otterfund/form";
import { EmojiPicker } from "@/components/otterfund/emoji-picker";
import { BRAND_THEME } from "@/components/otterfund/theme";
import { LogoMark } from "@/components/otterfund/logo";
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
  ArrowRight,
  Lock,
  CreditCard,
  Target,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { ACCOUNT_TYPES, CURRENCIES, getBudgetPlan, DEFAULT_BUDGET_PLAN_ID } from "@/lib/constants";
import { BudgetPlanPicker } from "@/components/otterfund/budget-plan-picker";
import { OnboardingBrandPanel, type PanelStep } from "@/components/onboarding/onboarding-brand-panel";
import { PlanStep } from "@/components/onboarding/plan-step";
import { Wordmark } from "@/components/otterfund/wordmark";
import { ConnectBankModal } from "@/components/dashboard/modals/connect-bank-modal";
import { PaywallModal } from "@/components/dashboard/modals/paywall-modal";
import { MerchantAvatar } from "@/components/otterfund/merchant-avatar";
import { dictionaryDomain } from "@/lib/merchant/dictionary";
import { gqlClient, gqlUpload, errMessage } from "@/lib/graphql/client";
import { canUse, FEATURE_REQUIRED_TIER, PLAN_META, type Feature, type PlanTier } from "@/lib/plans";

const AUTO_ONBOARD = /* GraphQL */ `
  mutation AutoOnboardFromFiles($files: [File!]!, $currency: String, $monthlyIncome: Float) {
    autoOnboardFromFiles(files: $files, currency: $currency, monthlyIncome: $monthlyIncome)
  }
`;

const COMPLETE_ONBOARDING = /* GraphQL */ `
  mutation CompleteOnboarding($input: OnboardingInput!) {
    completeOnboarding(input: $input)
  }
`;

const CONFIRM_IMPORT = /* GraphQL */ `
  mutation ConfirmImport($input: ConfirmImportInput!) {
    confirmImport(input: $input)
  }
`;

const DETECTED_INCOME = /* GraphQL */ `
  query DetectedMonthlyIncome {
    detectedMonthlyIncome
  }
`;

// Onboarding checkout returns to `/onboarding?checkout=…`, not the pricing flow,
// so the wizard can resume past the plan step (see `returnTo` in billing.ts).
const CREATE_CHECKOUT = /* GraphQL */ `
  mutation CreateCheckout($tier: String!, $interval: String, $returnTo: String) {
    createCheckoutSession(tier: $tier, interval: $interval, returnTo: $returnTo)
  }
`;

type AccountEntry = { name: string; type: string; balance: string; institution: string };
type RecurringEntry = { name: string; amount: string; cycle: string; dueDay?: number };
type GoalEntry = { name: string; emoji: string; target: string; deadline: string };
type Mode = "choose" | "manual" | "auto" | "connect";
// The flow, in order. Goal-setting hooks the user first, then a quick attribution
// question, then the plan menu, then the tier-aware account setup.
type Stage = "goals" | "referral" | "plan" | "setup";

// The three intro phases, shown as the left-panel step tracker before setup.
const INTRO_STEPS = [
  { label: "Goals", icon: Target },
  { label: "About you", icon: HelpCircle },
  { label: "Plan", icon: CreditCard },
] as const;
const INTRO_INDEX: Record<"goals" | "referral" | "plan", number> = { goals: 0, referral: 1, plan: 2 };

// "How did you hear about us?" choices — stored verbatim as the referral source.
const REFERRAL_OPTIONS = [
  "Friend or family",
  "Social media",
  "Search engine",
  "YouTube",
  "A news article or blog",
  "Something else",
];

type AutoAnalysis = {
  accounts: { name: string; type: string; balance: number }[];
  recurringExpenses: { name: string; amount: number; cycle: string }[];
  monthlyIncome: number;
  monthlySpend: number;
  budgetTarget: number;
  transactions: { name: string; amount: number; date: string; category: string; isRecurring: boolean }[];
  fileCount: number;
  transactionCount: number;
};

// Stripe Checkout is a full-page redirect, so the wizard's in-memory state would
// be lost across it. Checkout only ever starts from the plan menu, so on return
// we drop the user into the (now-unlocked) setup phase — no per-case routing
// needed. We just rehydrate everything they'd entered so far.
const RESUME_KEY = "of-onboarding-resume";
type ResumeBlob = {
  goals: GoalEntry[];
  referral: string;
  monthlyIncome: string;
  currency: string;
  plan: string;
  accounts: AccountEntry[];
  recurring: RecurringEntry[];
  autoAnalysis: AutoAnalysis | null;
};

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

const CONNECT_STEPS = [
  { label: "Setup", icon: DollarSign },
  { label: "Connect", icon: Landmark },
];

// The three ways to begin, shown as stacked rows on the chooser screen. `feature`
// marks a path that needs a paid tier — the chooser locks it for plans that lack
// it and opens the paywall inline instead of entering the flow.
const MODE_OPTIONS: { mode: Mode; icon: LucideIcon; title: string; desc: string; badge?: string; feature?: Feature }[] = [
  {
    mode: "connect",
    icon: Landmark,
    title: "Connect a bank",
    desc: "Link your bank to sync accounts and transactions automatically.",
    badge: "Fastest",
    feature: "bank_sync",
  },
  {
    mode: "auto",
    icon: Upload,
    title: "Upload statements",
    desc: "Add PDF or CSV statements. AI extracts your accounts and expenses.",
  },
  {
    mode: "manual",
    icon: PenLine,
    title: "Enter manually",
    desc: "Type in your income, accounts, and expenses by hand.",
  },
];

// Labels + headings for the wizard. Every input control comes from the brand
// kit (`TextInput` / `SelectInput`), so field styling lives in ONE place
// (globals.css `of-field`) and never drifts from the rest of the app's forms.
const LABEL_CLASS =
  "block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5";
const HEADING_CLASS =
  "text-2xl sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.05] text-[var(--color-of-ink)] mb-2";

export function OnboardingWizard({
  userName,
  currentPlan,
  initialCheckout,
}: {
  userName: string;
  /** The user's tier from the DB — non-free once a paid Checkout's webhook lands. */
  currentPlan: PlanTier;
  /** How the user arrived: `success`/`cancel` after a Stripe Checkout round-trip. */
  initialCheckout?: "success" | "cancel";
}) {
  // Flow order: goals → referral → plan → setup. Goal-setting comes first as a
  // low-friction hook; the plan menu sits before the tier-aware account setup.
  const [stage, setStage] = useState<Stage>("goals");
  // Tier whose Stripe Checkout is currently being created (disables its button).
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  // When set, the inline paywall is open for this locked feature (chooser lock).
  const [paywall, setPaywall] = useState<Feature | null>(null);
  // Briefly true while we rehydrate state after returning from a Checkout
  // redirect — avoids flashing the chooser before we route to the right place.
  const [resuming, setResuming] = useState(!!initialCheckout);

  const [mode, setMode] = useState<Mode>("choose");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Goals phase (savings goals) + referral phase ("how did you hear about us").
  const [goals, setGoals] = useState<GoalEntry[]>([
    { name: "", emoji: "", target: "", deadline: "" },
  ]);
  const [referral, setReferral] = useState("");

  // Manual fields
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [currency, setCurrency] = useState("CAD");
  // Budget plan drives the split: savings + spend allowance both derive from it.
  const [plan, setPlan] = useState(DEFAULT_BUDGET_PLAN_ID);
  const selectedPlan = getBudgetPlan(plan);
  const incomeNum = Number(monthlyIncome) || 0;
  const derivedSavings = Math.round((incomeNum * selectedPlan.savings) / 100);
  const budgetTarget = String(
    Math.max(0, Math.round((incomeNum * (selectedPlan.needs + selectedPlan.wants)) / 100))
  );
  const [accounts, setAccounts] = useState<AccountEntry[]>([
    { name: "", type: "Chequing", balance: "", institution: "" },
  ]);
  const [recurring, setRecurring] = useState<RecurringEntry[]>([
    { name: "", amount: "", cycle: "Monthly" },
  ]);

  // Connect (Plaid) fields
  const [showConnect, setShowConnect] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  // True once we've queried the bank for income after linking (regardless of
  // whether any was found) — drives the "detected vs. couldn't detect" copy.
  const [incomeDetected, setIncomeDetected] = useState(false);

  // Auto fields
  const [files, setFiles] = useState<File[]>([]);
  const [autoAnalysis, setAutoAnalysis] = useState<AutoAnalysis | null>(null);

  // Stash the current wizard state before a Checkout redirect so we can pick up
  // where we left off when Stripe sends the user back.
  const persistResume = () => {
    try {
      const blob: ResumeBlob = {
        goals,
        referral,
        monthlyIncome,
        currency,
        plan,
        accounts,
        recurring,
        autoAnalysis,
      };
      sessionStorage.setItem(RESUME_KEY, JSON.stringify(blob));
    } catch {
      // Private mode / storage disabled — the round-trip just starts fresh.
    }
  };

  // On return from Checkout, rehydrate and route. Runs once (keyed on the stable
  // `initialCheckout` prop). Success lands in the now-unlocked setup phase; a
  // cancel drops back on the plan menu with a gentle nudge.
  useEffect(() => {
    if (!initialCheckout) return;
    let blob: ResumeBlob | null = null;
    try {
      const raw = sessionStorage.getItem(RESUME_KEY);
      if (raw) blob = JSON.parse(raw) as ResumeBlob;
      sessionStorage.removeItem(RESUME_KEY);
    } catch {
      blob = null;
    }
    if (blob) {
      setGoals(blob.goals?.length ? blob.goals : [{ name: "", emoji: "", target: "", deadline: "" }]);
      setReferral(blob.referral ?? "");
      setMonthlyIncome(blob.monthlyIncome);
      setCurrency(blob.currency);
      setPlan(blob.plan);
      setAccounts(blob.accounts?.length ? blob.accounts : [{ name: "", type: "Chequing", balance: "", institution: "" }]);
      setRecurring(blob.recurring?.length ? blob.recurring : [{ name: "", amount: "", cycle: "Monthly" }]);
      setAutoAnalysis(blob.autoAnalysis);
    }
    if (initialCheckout === "success") {
      // Paid — nothing is locked now. Drop into the setup chooser.
      setStage("setup");
      setMode("choose");
      setStep(0);
    } else {
      // Canceled — no charge. Back to the plan menu.
      setStage("plan");
    }
    setResuming(false);
  }, [initialCheckout]);

  // --- Helpers ---
  const canAdvance = () => {
    if (mode === "manual") {
      switch (step) {
        case 0: return Number(monthlyIncome) > 0;
        case 1: return true; // a plan is always selected
        default: return true;
      }
    }
    if (mode === "auto") {
      return step === 0 ? files.length > 0 : true;
    }
    if (mode === "connect") {
      // Income isn't asked here — it's read from the bank after linking. A plan
      // is preselected, so the setup step can always advance.
      return true;
    }
    return false;
  };

  const addAccount = () => setAccounts([...accounts, { name: "", type: "Chequing", balance: "", institution: "" }]);
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

  const addGoal = () => setGoals([...goals, { name: "", emoji: "", target: "", deadline: "" }]);
  const removeGoal = (i: number) => setGoals(goals.filter((_, idx) => idx !== i));
  const updateGoal = (i: number, field: keyof GoalEntry, value: string) => {
    const updated = [...goals];
    updated[i] = { ...updated[i], [field]: value };
    setGoals(updated);
  };
  // At least one goal has both a name and a positive target → worth saving.
  const goalsValid = goals.some((g) => g.name.trim() && Number(g.target) > 0);

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
      const { autoOnboardFromFiles: data } = await gqlUpload(
        AUTO_ONBOARD,
        { files: files.map(() => null), currency },
        files.map((file, i) => ({ path: `variables.files.${i}`, file })),
      );
      setAutoAnalysis(data.analysis);

      // Pre-fill editable fields from analysis. Savings/budget aren't asked for
      // here — they derive from the chosen plan applied to this income.
      setMonthlyIncome(String(data.analysis.monthlyIncome));
      setAccounts(
        data.analysis.accounts.length > 0
          ? data.analysis.accounts.map((a: { name: string; type: string; balance: number }) => ({
              name: a.name,
              type: ACCOUNT_TYPES.find((t) => t.toLowerCase().replace(" ", "-") === a.type) || "Other",
              balance: String(a.balance),
              institution: "",
            }))
          : [{ name: "", type: "Chequing", balance: "", institution: "" }]
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
    } catch (e) {
      setError(errMessage(e));
      setStep(0);
    }
  };

  // --- Submit (shared for both modes) ---
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // A name is all it takes — balance defaults to $0 (same rule as the in-app
      // account form). Requiring a balance here silently dropped named accounts.
      const validAccounts = accounts.filter((a) => a.name.trim());
      const validRecurring = recurring.filter((r) => r.name && r.amount);
      // Goals need a name + a positive target; partial rows are dropped.
      const validGoals = goals.filter((g) => g.name.trim() && Number(g.target) > 0);

      await gqlClient.request(COMPLETE_ONBOARDING, {
        input: {
          monthlyIncome: Number(monthlyIncome),
          currency,
          // Server re-derives from the plan; sent for validation/back-compat.
          budgetTarget: Math.max(0, Number(budgetTarget) || 0),
          budgetPlan: plan,
          accounts: validAccounts.map((a) => ({
            name: a.name.trim(),
            type: a.type.toLowerCase().replace(" ", "-"),
            balance: Number(a.balance) || 0,
            institution: a.institution.trim() || undefined,
          })),
          recurringExpenses: validRecurring.map((r) => ({
            name: r.name,
            amount: Number(r.amount),
            cycle: r.cycle,
            dueDay: r.dueDay,
          })),
          goals: validGoals.map((g) => ({
            name: g.name.trim(),
            emoji: g.emoji || undefined,
            target: Number(g.target),
            deadline: g.deadline || undefined,
          })),
          referralSource: referral || undefined,
        },
      });

      // If auto mode, also import the transactions
      if (mode === "auto" && autoAnalysis?.transactions?.length) {
        await gqlClient.request(CONFIRM_IMPORT, {
          input: {
            statementId: null,
            transactions: autoAnalysis.transactions.map((t) => ({
              name: t.name,
              amount: t.amount,
              date: t.date,
            })),
          },
        });
      }

      window.location.href = "/dashboard";
    } catch (e) {
      setError(errMessage(e));
      setLoading(false);
    }
  };

  // Steps for the active setup flow (empty on the chooser screen).
  const modeSteps: PanelStep[] =
    mode === "manual" ? MANUAL_STEPS : mode === "connect" ? CONNECT_STEPS : mode === "auto" ? AUTO_STEPS : [];
  const totalSteps = modeSteps.length;
  const isLastStep = step === totalSteps - 1;
  // Where we are, in coarse terms — drives the left tracker, back link, layout.
  const isIntro = stage === "goals" || stage === "referral" || stage === "plan";
  const inMode = stage === "setup" && mode !== "choose";
  // Left tracker: the 3 intro nodes during goals/referral/plan; the mode's steps
  // once inside a setup flow; nothing (the "expect" list) on the chooser.
  const panelSteps: PanelStep[] | null = isIntro
    ? (INTRO_STEPS as unknown as PanelStep[])
    : inMode
      ? modeSteps
      : null;
  const panelStep = isIntro ? INTRO_INDEX[stage as "goals" | "referral" | "plan"] : step;

  const changeMode = () => {
    setMode("choose");
    setStep(0);
    setError("");
  };

  // Contextual back across the whole flow: unwind intro phases, or in setup drop
  // the mode (change path) / return to the plan menu from the chooser.
  const canGoBack = stage !== "goals";
  const backLabel = stage === "setup" && mode !== "choose" ? "Change path" : "Back";
  const goBack = () => {
    setError("");
    if (stage === "referral") setStage("goals");
    else if (stage === "plan") setStage("referral");
    else if (stage === "setup") {
      if (mode !== "choose") changeMode();
      else setStage("plan");
    }
  };

  // Hand off to Stripe Checkout (same server mutation /pricing uses), returning to
  // /onboarding?checkout=… so the wizard can resume. Callers stash state first.
  const startCheckout = async (tier: PlanTier, interval: "month" | "year") => {
    setError("");
    setCheckoutTier(tier);
    try {
      const res = await gqlClient.request<{ createCheckoutSession: string }>(CREATE_CHECKOUT, {
        tier,
        interval,
        returnTo: "onboarding",
      });
      window.location.href = res.createCheckoutSession;
    } catch (e) {
      setError(errMessage(e));
      setCheckoutTier(null);
    }
  };

  // Plan menu → Free (or an already-paid tier) proceeds into setup; a paid tier
  // stashes state and heads to Checkout, returning into the now-unlocked setup.
  const handlePlanContinue = () => {
    setError("");
    setStage("setup");
    setMode("choose");
    setStep(0);
  };
  const handlePlanCheckout = (tier: PlanTier, interval: "month" | "year") => {
    persistResume();
    startCheckout(tier, interval);
  };

  // The chooser paywall is a full offer flow now. Its "Get {tier}" CTA stashes
  // state and hands off to Checkout inline (resuming into the unlocked setup when
  // Stripe returns); "View all plans" drops back to the plan menu — the full tier
  // comparison — rather than jumping straight to Stripe.
  const handleChooserCheckout = (tier: PlanTier, interval: "month" | "year") => {
    persistResume();
    startCheckout(tier, interval);
  };
  const handleChooserViewAllPlans = () => {
    setPaywall(null);
    setError("");
    setStage("plan");
  };

  // A locked path was clicked in the chooser: open the paywall instead of entering.
  const chooseMode = (opt: (typeof MODE_OPTIONS)[number]) => {
    if (opt.feature && !canUse(currentPlan, opt.feature)) {
      setPaywall(opt.feature);
      return;
    }
    setMode(opt.mode);
  };

  // Returning from Checkout — hold a calm loader until the resume effect routes us.
  if (resuming) {
    return (
      <div className="grid min-h-screen w-full place-items-center bg-[var(--color-of-canvas)]">
        <div className="flex flex-col items-center gap-3 text-[var(--color-of-muted)]">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm font-medium">Finishing up…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full bg-[var(--color-of-canvas)] lg:grid ${
        // The plan step lays 3 cards on the right — give that side more width by
        // slimming the brand panel, so the cards breathe (and centre with margins
        // on wide screens). Other steps keep the balanced split.
        stage === "plan"
          ? "lg:grid-cols-[0.62fr_1fr] xl:grid-cols-[0.55fr_1fr]"
          : "lg:grid-cols-[1.02fr_1fr] xl:grid-cols-[1.08fr_1fr]"
      }`}
    >
      <OnboardingBrandPanel userName={userName} steps={panelSteps} step={panelStep} />

      <main className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10">
        {/* compact brand header — the panel owns branding on lg+ */}
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/" aria-label="otterfund home" className="inline-flex items-center">
            <LogoMark size={38} />
          </Link>
          {canGoBack && (
            <button
              onClick={goBack}
              className="text-[13px] font-medium text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]"
            >
              {backLabel}
            </button>
          )}
        </div>

        <div className={`flex flex-1 justify-center py-10 ${stage === "plan" ? "items-start" : "items-center"}`}>
          {/* The plan step lays 3 tier cards side by side, so it needs a wider
              column than the single-field wizard steps. */}
          <div className={`w-full ${stage === "plan" ? "max-w-5xl" : "max-w-xl"}`}>
            {canGoBack && (
              <button
                onClick={goBack}
                className="mb-7 hidden items-center gap-1.5 text-[13px] font-medium text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)] lg:inline-flex"
              >
                <span aria-hidden>←</span> {backLabel}
              </button>
            )}

            {/* mobile step progress — the panel's tracker is hidden on small screens */}
            {inMode && (
              <div className="mb-7 lg:hidden">
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[var(--color-of-ink)]">{modeSteps[step].label}</span>
                  <span className="of-num text-[var(--color-of-muted)]">
                    Step {step + 1} of {totalSteps}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-of-line)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
                    style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {stage === "goals" ? (
              <div className="of-enter space-y-6 sm:space-y-7">
                <div>
                  <h2 className={HEADING_CLASS}>What are you saving for?</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">
                    Set a goal or two: a name, a target, and when you want it by. You can skip
                    this and add goals anytime later.
                  </p>
                </div>
                <div className="max-w-[200px]">
                  <label className={LABEL_CLASS}>Currency</label>
                  <SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </SelectInput>
                </div>
                <GoalRows goals={goals} onUpdate={updateGoal} onAdd={addGoal} onRemove={removeGoal} />
                <div className="flex justify-end pt-1">
                  <Button size="sm" onClick={() => { setError(""); setStage("referral"); }} className="px-6">
                    {goalsValid ? "Continue" : "Skip for now"}
                  </Button>
                </div>
              </div>
            ) : stage === "referral" ? (
              <div className="of-enter space-y-6 sm:space-y-7">
                <div>
                  <h2 className={HEADING_CLASS}>How did you hear about us?</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">
                    One quick question. It helps us reach more people like you. Optional.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {REFERRAL_OPTIONS.map((opt) => {
                    const on = referral === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setReferral(on ? "" : opt)}
                        className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-[13.5px] font-medium transition-colors"
                        style={
                          on
                            ? { borderColor: "var(--color-primary)", background: "var(--accent)", color: "var(--color-of-ink)" }
                            : { borderColor: "var(--color-of-line)", background: "oklch(98% 0.004 90)", color: "var(--color-of-muted)" }
                        }
                      >
                        <span
                          className="grid h-4 w-4 shrink-0 place-items-center rounded-full border"
                          style={{
                            borderColor: on ? "var(--color-primary)" : "var(--color-of-line)",
                            background: on ? "var(--color-primary)" : "transparent",
                          }}
                        >
                          {on && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-1">
                  <Button size="sm" onClick={() => { setError(""); setStage("plan"); }} className="px-6">
                    Continue
                  </Button>
                </div>
              </div>
            ) : stage === "plan" ? (
              <div className="of-enter">
                <PlanStep
                  currentPlan={currentPlan}
                  busyTier={checkoutTier}
                  canceled={initialCheckout === "cancel"}
                  onContinue={handlePlanContinue}
                  onCheckout={handlePlanCheckout}
                />
                {error && <p className="mt-5 text-sm text-[var(--color-of-clay)] font-medium">{error}</p>}
              </div>
            ) : mode === "choose" ? (
              <div className="of-enter">
                <h2 className={HEADING_CLASS}>How would you like to start?</h2>
                <p className="mb-7 text-sm text-[var(--color-of-muted)]">
                  Pick a path. You can switch anytime.
                </p>
                <div className="flex flex-col gap-3">
                  {MODE_OPTIONS.map((o) => {
                    // Locked when the path needs a feature the current tier lacks.
                    // The row still shows — click opens the paywall, not a dead end.
                    const locked = o.feature ? !canUse(currentPlan, o.feature) : false;
                    const reqTier = o.feature ? PLAN_META[FEATURE_REQUIRED_TIER[o.feature]].name : "";
                    return (
                      <button
                        key={o.mode}
                        onClick={() => chooseMode(o)}
                        className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--color-of-line)] bg-[oklch(98%_0.004_90)] p-4 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-of-surface)] sm:p-5"
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent)]">
                          <o.icon className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-of-ink)]">
                              {o.title}
                            </span>
                            {locked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">
                                <Lock className="h-2.5 w-2.5" strokeWidth={2.6} />
                                {reqTier}
                              </span>
                            ) : o.badge ? (
                              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-primary)]">
                                {o.badge}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--color-of-muted)]">
                            {o.desc}
                          </span>
                        </span>
                        {locked ? (
                          <Lock className="h-4 w-4 shrink-0 text-[var(--color-of-faint)] transition-colors group-hover:text-[var(--color-primary)]" />
                        ) : (
                          <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-of-faint)] transition-colors group-hover:text-[var(--color-primary)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div key={`${mode}-${step}`} className="of-enter">
        {/* ====== MANUAL MODE ====== */}
        {mode === "manual" && (
          <>
            {/* Step 1: Income */}
            {step === 0 && (
              <div className="space-y-6 sm:space-y-7" key="income">
                <div>
                  <h2 className={HEADING_CLASS}>Monthly Income</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">What&apos;s your monthly take-home income?</p>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Monthly Income</label>
                  <TextInput type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="5000" min="0" step="100" />
                </div>
              </div>
            )}

            {/* Step 2: Budget plan */}
            {step === 1 && (
              <div className="space-y-6 sm:space-y-7" key="budget">
                <div>
                  <h2 className={HEADING_CLASS}>Your budget plan</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">Pick how to split your income across needs, wants, and savings. You can change this anytime in Settings.</p>
                </div>
                <BudgetPlanPicker value={plan} onChange={setPlan} accent={BRAND_THEME.accent} />
                {incomeNum > 0 && (
                  <p className="text-xs text-[var(--color-of-muted)]">
                    On {fmtCurrency(incomeNum)}/mo, that&apos;s {fmtCurrency(derivedSavings)} saved and {fmtCurrency(Number(budgetTarget))} to spend each month.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Accounts */}
            {step === 2 && (
              <div className="space-y-6 sm:space-y-7" key="accounts">
                <div>
                  <h2 className={HEADING_CLASS}>Your Accounts</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">Add your bank accounts and credit cards. Name the bank and we&apos;ll show its logo.</p>
                </div>
                <AccountRows accounts={accounts} onUpdate={updateAccount} onAdd={addAccount} onRemove={removeAccount} />
              </div>
            )}

            {/* Step 4: Recurring */}
            {step === 3 && (
              <div className="space-y-6 sm:space-y-7" key="recurring">
                <div>
                  <h2 className={HEADING_CLASS}>Recurring Expenses</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">Add known recurring expenses like rent, subscriptions, and insurance.</p>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto of-scroll pr-1">
                  {recurring.map((rec, i) => {
                    // Best-effort live logo from the client dictionary (Netflix →
                    // netflix.com …); the server resolves the rest (cache → Claude)
                    // on submit, so the stored subscription shows a logo in-app too.
                    const merchant = rec.name.trim();
                    const domain = merchant ? dictionaryDomain(merchant) : null;
                    return (
                    <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {merchant ? (
                            <MerchantAvatar name={merchant} domain={domain} bg="var(--accent)" ink="var(--accent-foreground)" size={34} fit="contain" />
                          ) : (
                            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-[var(--accent)]">
                              <RefreshCw className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.9} />
                            </span>
                          )}
                          <TextInput value={rec.name} onChange={(e) => updateRecurring(i, "name", e.target.value)} placeholder="e.g. Rent, Netflix" />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <TextInput type="number" value={rec.amount} onChange={(e) => updateRecurring(i, "amount", e.target.value)} placeholder="Amount" />
                          </div>
                          <div className="flex-1">
                            <SelectInput value={rec.cycle} onChange={(e) => updateRecurring(i, "cycle", e.target.value)}>
                              <option value="Monthly">Monthly</option>
                              <option value="Annual">Annual</option>
                              <option value="Weekly">Weekly</option>
                            </SelectInput>
                          </div>
                        </div>
                      </div>
                      {recurring.length > 1 && (
                        <button onClick={() => removeRecurring(i)} className="mt-2.5 text-[var(--color-of-muted)] hover:text-[var(--color-of-clay)] transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    );
                  })}
                </div>
                <button onClick={addRecurring} className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-semibold hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add another expense
                </button>
              </div>
            )}

            {/* Step 5: Review (manual) */}
            {step === 4 && (
              <ReviewStep
                monthlyIncome={monthlyIncome}
                planName={selectedPlan.name}
                savings={String(derivedSavings)}
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

        {/* ====== CONNECT (Plaid) MODE ====== */}
        {mode === "connect" && (
          <>
            {/* Step 1: Setup (budget plan + currency — income comes from the bank) */}
            {step === 0 && (
              <div className="space-y-6 sm:space-y-7" key="connect-setup">
                <div>
                  <h2 className={HEADING_CLASS}>A few basics</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">Choose a budget plan. We&apos;ll read your income straight from your bank.</p>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Budget plan</label>
                  <BudgetPlanPicker value={plan} onChange={setPlan} accent={BRAND_THEME.accent} />
                </div>
              </div>
            )}

            {/* Step 2: Connect the bank */}
            {step === 1 && (
              <div className="space-y-6 sm:space-y-7" key="connect-link">
                <div>
                  <h2 className={HEADING_CLASS}>Connect your bank</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">Securely link your bank through Plaid. We&apos;ll import your accounts and recent transactions, then keep them in sync.</p>
                </div>

                {bankConnected ? (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--color-of-line)] bg-[var(--accent)]">
                      <Check className="w-5 h-5 text-[var(--color-primary)]" />
                      <div className="text-sm font-semibold text-[var(--color-of-ink)]">Bank connected. Your accounts are importing.</div>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Detected monthly income</label>
                      <TextInput type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="0" min="0" step="100" />
                      <p className="text-xs text-[var(--color-of-muted)] mt-1.5">
                        {Number(monthlyIncome) > 0
                          ? "Estimated from the deposits we just imported. Edit it if it looks off."
                          : incomeDetected
                            ? "We couldn't detect income from your deposits yet. Enter it here, or adjust later in Settings."
                            : "Reading your deposits…"}
                      </p>
                    </div>
                    {incomeNum > 0 && (
                      <p className="text-xs text-[var(--color-of-muted)]">
                        On {fmtCurrency(incomeNum)}/mo with the {selectedPlan.name}, that&apos;s {fmtCurrency(derivedSavings)} saved and {fmtCurrency(Number(budgetTarget))} to spend each month.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-of-line)] bg-[oklch(98%_0.004_90)] p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent)]">
                      <Landmark className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.9} />
                    </span>
                    <div>
                      <div className="text-[14px] font-semibold text-[var(--color-of-ink)]">Link your bank securely</div>
                      <div className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--color-of-muted)]">
                        <Wordmark />{" "}imports your accounts and recent transactions through Plaid and keeps them in sync. Your credentials are encrypted and never seen by <Wordmark />.
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--color-of-muted)]">
                  {bankConnected
                    ? "You're all set. Click Get Started to finish."
                    : "Not ready? Skip for now. You can connect anytime from Settings → Connections."}
                </p>
              </div>
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
                  <h2 className={HEADING_CLASS}>Upload Statements</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">
                    Drop your bank statements (CSV or PDF). Upload as many as you like, and AI will extract accounts, recurring expenses, and categorize transactions.
                  </p>
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border border-dashed border-[var(--color-of-line)] rounded-2xl p-8 text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                  onClick={() => document.getElementById("auto-file-input")?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-[var(--color-of-muted)] mb-3" />
                  <p className="text-sm font-semibold text-[var(--color-of-ink)]">Drop CSV or PDF files here</p>
                  <p className="text-xs text-[var(--color-of-muted)] mt-1">or click to browse (multiple files supported)</p>
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
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
                        <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                        <span className="text-sm flex-1 truncate text-[var(--color-of-ink)]">{f.name}</span>
                        <span className="text-xs text-[var(--color-of-muted)]">{(f.size / 1024).toFixed(1)} KB</span>
                        <button onClick={() => removeFile(i)} className="text-[var(--color-of-muted)] hover:text-[var(--color-of-clay)]">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && <p className="text-sm text-[var(--color-of-clay)] font-medium">{error}</p>}
              </div>
            )}

            {/* Step 2: Analyzing */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center py-12" key="analyzing">
                <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin mb-4" />
                <h2 className={`${HEADING_CLASS} text-center`}>Analyzing your statements...</h2>
                <p className="text-sm text-[var(--color-of-muted)] text-center max-w-sm">
                  AI is reading {files.length} file{files.length > 1 ? "s" : ""} to extract your accounts, recurring expenses, income, and transactions. This may take a minute.
                </p>
              </div>
            )}

            {/* Step 3: Review (auto) */}
            {step === 2 && autoAnalysis && (
              <div className="space-y-6 sm:space-y-7" key="auto-review">
                <div>
                  <h2 className={HEADING_CLASS}>Here&apos;s what we found</h2>
                  <p className="text-sm text-[var(--color-of-muted)]">
                    <Check className="w-3.5 h-3.5 inline text-[var(--color-primary)] mr-1" />
                    {autoAnalysis.transactionCount} transactions from {autoAnalysis.fileCount} file{autoAnalysis.fileCount > 1 ? "s" : ""}. Review and edit below.
                  </p>
                </div>

                {/* Editable income + budget plan */}
                <div>
                  <label className={LABEL_CLASS}>Monthly Income</label>
                  <TextInput type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-2">Budget plan</div>
                  <BudgetPlanPicker value={plan} onChange={setPlan} accent={BRAND_THEME.accent} />
                  {incomeNum > 0 && (
                    <p className="text-xs text-[var(--color-of-muted)] mt-2">
                      On {fmtCurrency(incomeNum)}/mo, that&apos;s {fmtCurrency(derivedSavings)} saved and {fmtCurrency(Number(budgetTarget))} to spend each month.
                    </p>
                  )}
                </div>

                {/* Accounts */}
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-2">
                    Accounts ({accounts.filter((a) => a.name).length})
                  </div>
                  <AccountRows accounts={accounts} onUpdate={updateAccount} onAdd={addAccount} onRemove={removeAccount} />
                </div>

                {/* Recurring */}
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-2">
                    Recurring Expenses ({recurring.filter((r) => r.name).length})
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto of-scroll pr-1">
                    {recurring.map((rec, i) => (
                      <div key={i} className="flex gap-2 items-center p-2.5 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
                        <div className="flex-1"><TextInput value={rec.name} onChange={(e) => updateRecurring(i, "name", e.target.value)} placeholder="Expense name" /></div>
                        <div className="w-24"><TextInput type="number" value={rec.amount} onChange={(e) => updateRecurring(i, "amount", e.target.value)} placeholder="$" /></div>
                        <div className="w-32">
                          <SelectInput value={rec.cycle} onChange={(e) => updateRecurring(i, "cycle", e.target.value)}>
                            <option value="Monthly">Monthly</option>
                            <option value="Annual">Annual</option>
                            <option value="Weekly">Weekly</option>
                          </SelectInput>
                        </div>
                        {recurring.length > 1 && (
                          <button onClick={() => removeRecurring(i)} className="text-[var(--color-of-muted)] hover:text-[var(--color-of-clay)]"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addRecurring} className="flex items-center gap-1 text-xs text-[var(--color-primary)] font-semibold hover:underline mt-1.5">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {error && <p className="text-sm text-[var(--color-of-clay)] font-medium">{error}</p>}
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 gap-3">
          {step > 0 && !(mode === "auto" && step === 1) ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="px-6 text-[var(--color-of-muted)]">
              Back
            </Button>
          ) : (
            <div />
          )}

          {mode === "auto" && step === 0 ? (
            <Button size="sm" onClick={handleAutoAnalyze} disabled={files.length === 0} className="px-6">
              Analyze
            </Button>
          ) : mode === "auto" && step === 1 ? (
            <div />
          ) : !isLastStep ? (
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="px-6">
              Continue
            </Button>
          ) : mode === "connect" && !bankConnected ? (
            // Connecting stays the primary action so you can still link a bank
            // even if you didn't at first; skipping is an explicit secondary.
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSubmit} disabled={loading} className="px-5 text-[var(--color-of-muted)]">
                {loading ? "Setting up..." : "Skip for now"}
              </Button>
              <Button size="sm" onClick={() => setShowConnect(true)} disabled={loading} className="px-6">
                <Landmark data-icon="inline-start" className="w-4 h-4" /> Connect a bank
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={loading} className="px-6">
              {loading ? "Setting up..." : "Get Started"}
            </Button>
          )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConnectBankModal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onLinked={async () => {
          setBankConnected(true);
          setShowConnect(false);
          // The initial Plaid sync runs before onLinked fires, so the imported
          // transactions are already queryable. Pre-fill the income figure.
          try {
            const { detectedMonthlyIncome } = await gqlClient.request<{
              detectedMonthlyIncome: number | null;
            }>(DETECTED_INCOME);
            if (detectedMonthlyIncome && detectedMonthlyIncome > 0) {
              setMonthlyIncome(String(Math.round(detectedMonthlyIncome)));
            }
          } catch {
            // Leave the field for the user to fill in manually.
          } finally {
            setIncomeDetected(true);
          }
        }}
      />

      {/* Inline upgrade prompt for a locked path in the chooser — the full
          outcome → offer flow. Buying resumes into the now-unlocked setup when
          Stripe returns; "View all plans" drops back to the plan menu. */}
      <PaywallModal
        open={paywall !== null}
        feature={paywall}
        theme={BRAND_THEME}
        busy={checkoutTier !== null}
        onClose={() => setPaywall(null)}
        onCheckout={handleChooserCheckout}
        onViewAllPlans={handleChooserViewAllPlans}
      />
    </div>
  );
}

// --- Account rows (shared by the manual step + the auto-analysis review) ---
// Each row mirrors the in-app account form's fields — name, bank (with a live
// logo), type, balance — so an account added here looks and stores identically.
function AccountRows({
  accounts,
  onUpdate,
  onAdd,
  onRemove,
}: {
  accounts: AccountEntry[];
  onUpdate: (i: number, field: keyof AccountEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <>
      <div className="space-y-3 max-h-[320px] overflow-y-auto of-scroll pr-1">
        {accounts.map((acc, i) => {
          // Best-effort live logo from the client dictionary; the server resolves
          // the rest (cache → Claude) on submit, so unknown banks still get a logo.
          const bank = acc.institution.trim();
          const domain = bank ? dictionaryDomain(bank) : null;
          return (
            <div key={i} className="flex gap-2 items-start p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
              <div className="flex-1 space-y-2">
                <TextInput value={acc.name} onChange={(e) => onUpdate(i, "name", e.target.value)} placeholder="Account name" />
                <div className="flex items-center gap-2">
                  {bank ? (
                    <MerchantAvatar name={bank} domain={domain} bg="var(--accent)" ink="var(--accent-foreground)" size={34} fit="contain" />
                  ) : (
                    <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-[var(--accent)]">
                      <Landmark className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.9} />
                    </span>
                  )}
                  <TextInput value={acc.institution} onChange={(e) => onUpdate(i, "institution", e.target.value)} placeholder="Bank (optional), e.g. TD" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SelectInput value={acc.type} onChange={(e) => onUpdate(i, "type", e.target.value)}>
                      {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </SelectInput>
                  </div>
                  <div className="flex-1">
                    <TextInput type="number" value={acc.balance} onChange={(e) => onUpdate(i, "balance", e.target.value)} placeholder="Balance" />
                  </div>
                </div>
              </div>
              {accounts.length > 1 && (
                <button onClick={() => onRemove(i)} className="mt-2.5 text-[var(--color-of-muted)] hover:text-[var(--color-of-clay)] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={onAdd} className="mt-3 flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-semibold hover:underline">
        <Plus className="w-3.5 h-3.5" /> Add another account
      </button>
    </>
  );
}

// --- Goal rows (the goals phase) ---
// Same fields as the in-app New Goal form — emoji, name, target, deadline — so a
// goal set here is identical to one added later. All optional; skip is allowed.
function GoalRows({
  goals,
  onUpdate,
  onAdd,
  onRemove,
}: {
  goals: GoalEntry[];
  onUpdate: (i: number, field: keyof GoalEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <>
      {/* No overflow container here — the EmojiPicker popover is absolutely
          positioned and would be clipped (and force an ugly scroll) inside one. */}
      <div className="space-y-3">
        {goals.map((g, i) => (
          <div key={i} className="flex gap-2.5 items-start p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
            <div className="w-14 shrink-0">
              <EmojiPicker value={g.emoji} onChange={(v) => onUpdate(i, "emoji", v)} />
            </div>
            <div className="flex-1 space-y-2">
              <TextInput value={g.name} onChange={(e) => onUpdate(i, "name", e.target.value)} placeholder="e.g. Emergency fund" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <TextInput type="number" value={g.target} onChange={(e) => onUpdate(i, "target", e.target.value)} placeholder="Target amount" />
                </div>
                <div className="flex-1">
                  <DateInput value={g.deadline} onChange={(e) => onUpdate(i, "deadline", e.target.value)} />
                </div>
              </div>
            </div>
            {goals.length > 1 && (
              <button onClick={() => onRemove(i)} className="mt-2.5 text-[var(--color-of-muted)] hover:text-[var(--color-of-clay)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={onAdd} className="mt-3 flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-semibold hover:underline">
        <Plus className="w-3.5 h-3.5" /> Add another goal
      </button>
    </>
  );
}

// --- Review step (shared UI) ---
function ReviewStep({
  monthlyIncome, planName, savings, budgetTarget, currency, accounts, recurring, fmtCurrency, error,
}: {
  monthlyIncome: string; planName: string; savings: string; budgetTarget: string; currency: string;
  accounts: AccountEntry[]; recurring: RecurringEntry[];
  fmtCurrency: (v: string | number) => string; error: string;
}) {
  return (
    <div className="space-y-6 sm:space-y-7" key="review">
      <div>
        <h2 className={HEADING_CLASS}>Looking Good!</h2>
        <p className="text-sm text-[var(--color-of-muted)]">Here&apos;s a summary. You can go back to edit anything.</p>
      </div>
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
          <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1">Monthly Income</div>
          <div className="of-num text-lg text-[var(--color-of-ink)]">{fmtCurrency(monthlyIncome)} {currency}</div>
        </div>
        <div className="p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
          <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1">Budget Plan</div>
          <div className="text-lg font-semibold text-[var(--color-of-ink)]">{planName} <span className="of-num text-sm text-[var(--color-of-muted)] font-normal">· {fmtCurrency(savings)}/mo saved ({Math.round((Number(savings) / Number(monthlyIncome)) * 100) || 0}% of income)</span></div>
        </div>
        <div className="p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
          <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1">Spending Budget</div>
          <div className="of-num text-lg text-[var(--color-of-ink)]">{fmtCurrency(budgetTarget)}/mo</div>
        </div>
        {accounts.some((a) => a.name) && (
          <div className="p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
            <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1">Accounts ({accounts.filter((a) => a.name).length})</div>
            {accounts.filter((a) => a.name).map((a, i) => (
              <div key={i} className="flex justify-between text-sm py-0.5 text-[var(--color-of-ink)]">
                <span>{a.name} <span className="text-[var(--color-of-muted)]">· {a.type}</span></span>
                <span className="font-medium">{fmtCurrency(a.balance)}</span>
              </div>
            ))}
          </div>
        )}
        {recurring.some((r) => r.name) && (
          <div className="p-3 rounded-xl bg-[oklch(98%_0.004_90)] border border-[var(--color-of-line)]">
            <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1">Recurring Expenses ({recurring.filter((r) => r.name).length})</div>
            {recurring.filter((r) => r.name).map((r, i) => (
              <div key={i} className="flex justify-between text-sm py-0.5 text-[var(--color-of-ink)]">
                <span>{r.name} <span className="text-[var(--color-of-muted)]">· {r.cycle}</span></span>
                <span className="font-medium">{fmtCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-[var(--color-of-clay)] font-medium">{error}</p>}
    </div>
  );
}
