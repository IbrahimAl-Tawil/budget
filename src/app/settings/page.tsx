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

      <div className="max-w-2xl mx-auto px-7 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/dashboard" className="font-serif text-xl tracking-[-0.02em] text-bulga-text no-underline">
              Bulg<em className="not-italic text-sage">a</em>
            </a>
            <h1 className="font-serif text-2xl mt-2">Settings</h1>
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
