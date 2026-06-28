import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user) redirect("/login");

  return (
    <div className="relative z-[1] min-h-screen">

      <div className="max-w-[720px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="flex items-start justify-between mb-12 sm:mb-16 gap-4">
          <div>
            <a href="/dashboard" className="font-serif text-xl tracking-[-0.02em] text-bulga-text no-underline">
              Bulg<em className="not-italic text-sage">a</em>
            </a>
            <div className="text-[11px] font-medium tracking-[0.07em] uppercase text-muted-text mt-3">Account</div>
            <h1 className="font-serif text-[clamp(2.5rem,7vw,3.5rem)] tracking-[-0.035em] leading-[0.95] mt-1">Settings</h1>
          </div>
          <a
            href="/dashboard"
            className="text-sm text-sage font-semibold hover:underline"
          >
            &larr; Back to Dashboard
          </a>
        </div>

        <SettingsClient
          user={{
            name: user.name,
            email: user.email,
            monthlyIncome: user.monthlyIncome || 0,
            currency: user.currency,
            budgetTarget: user.budgetTarget || 0,
          }}
        />
      </div>
    </div>
  );
}
