import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { toPlanTier } from "@/lib/plans";

export default async function OnboardingPage({
  searchParams,
}: {
  // Set when returning from a Stripe Checkout started in the plan step.
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  // getClaims() verifies the JWT locally (asymmetric ES256 keys) — no network
  // round-trip to the Auth server, unlike getUser().
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: data.claims.sub },
    select: { name: true, onboardingDone: true, plan: true },
  });
  if (profile?.onboardingDone) redirect("/dashboard");

  const { checkout } = await searchParams;
  const initialCheckout =
    checkout === "success" ? "success" : checkout === "cancel" ? "cancel" : undefined;

  // The wizard renders the full split-screen shell (brand panel + form column).
  return (
    <div className="text-[var(--color-of-ink)]">
      <OnboardingWizard
        userName={profile?.name ?? ""}
        currentPlan={toPlanTier(profile?.plan)}
        initialCheckout={initialCheckout}
      />
    </div>
  );
}
