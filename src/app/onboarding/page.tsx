import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Wordmark } from "@/components/bulga/logo";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.onboardingDone) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bk-canvas)] text-[var(--color-bk-ink)]">
      <div className="w-full max-w-xl mx-auto">
        <div className="flex flex-col items-center gap-3 text-center mb-10">
          <Wordmark size={30} />
          <p className="text-[var(--color-bk-muted)] text-[13px]">
            Let&apos;s set up your budget
          </p>
        </div>
        <OnboardingWizard userName={session.user.name ?? ""} />
      </div>
    </div>
  );
}
