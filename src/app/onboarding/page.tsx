import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.onboardingDone) redirect("/dashboard");

  return (
    <div className="relative z-[1] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="font-serif text-3xl tracking-[-0.02em] text-bulga-text">
            Bulg<em className="not-italic text-sage">a</em>
          </span>
          <p className="text-neutral-400 text-sm mt-2">
            Let&apos;s set up your budget
          </p>
        </div>
        <OnboardingWizard userName={session.user.name ?? ""} />
      </div>
    </div>
  );
}
