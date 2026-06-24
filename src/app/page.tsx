import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, PieChart, Upload, Brain, Shield } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  // If already logged in, go straight to dashboard
  if (session?.user?.onboardingDone) redirect("/dashboard");
  if (session && !session.user.onboardingDone) redirect("/onboarding");

  return (
    <div className="relative z-[1] min-h-screen flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-7 py-5 shrink-0">
        <span className="font-serif text-xl tracking-[-0.02em] text-bulga-text">
          Bulg<em className="not-italic text-sage">a</em>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-semibold text-neutral-400 px-4 py-2 rounded-full hover:text-bulga-text transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-[13px] font-semibold text-white bg-bulga-text px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-7 pb-20 text-center">
        <div className="max-w-2xl">
          <h1 className="font-serif text-[56px] tracking-[-0.03em] leading-[1.1] text-bulga-text mb-5">
            Your finances,
            <br />
            <span className="text-sage">beautifully clear</span>
          </h1>
          <p className="text-lg text-neutral-400 leading-relaxed max-w-lg mx-auto mb-8">
            Import bank statements, let AI categorize your spending, track
            budgets and goals — all in one minimalist dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-bulga-text px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-bulga-text border border-black/[0.06] px-6 py-3 rounded-full hover:bg-neutral-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-4 gap-4 mt-20 max-w-3xl w-full">
          {[
            {
              icon: Upload,
              title: "Import Statements",
              desc: "Upload CSV or PDF bank statements",
            },
            {
              icon: Brain,
              title: "AI Categorization",
              desc: "Transactions sorted automatically",
            },
            {
              icon: PieChart,
              title: "Budget Tracking",
              desc: "See where every dollar goes",
            },
            {
              icon: Shield,
              title: "Private & Local",
              desc: "Your data stays on your machine",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="border border-black/[0.06] rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[0_12px_48px_oklch(16%_0.02_260/0.1)]"
            >
              <f.icon className="w-5 h-5 text-sage mb-3" />
              <div className="text-[13px] font-semibold text-bulga-text mb-1">
                {f.title}
              </div>
              <div className="text-[11px] text-neutral-400 leading-relaxed">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-[11px] text-neutral-400">
        Bulga &mdash; Personal budgeting, simplified.
      </footer>
    </div>
  );
}
