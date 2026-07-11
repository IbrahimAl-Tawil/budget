"use client";

// In-page locked state for a routed page a user's plan doesn't include (the
// Insights + Investments routes). Deep-linkable and calm: the page still loads,
// but instead of the real content it shows this on-brand upsell panel whose CTA
// opens the same paywall modal the chrome owns. The hard enforcement lives in
// the resolvers — this is the friendly front door.

import { Check, Lock } from "lucide-react";
import { Card } from "@/components/otterfund/card";
import { OtterFace } from "@/components/otterfund/logo";
import { Button } from "@/components/ui/button";
import { useOtterfundChrome } from "@/components/otterfund/chrome-context";
import { FEATURE_COPY, FEATURE_REQUIRED_TIER, PLAN_META, type Feature } from "@/lib/plans";

export function LockedFeature({ feature }: { feature: Feature }) {
  const { theme, openPaywall } = useOtterfundChrome();
  const copy = FEATURE_COPY[feature];
  const tier = FEATURE_REQUIRED_TIER[feature];

  return (
    <div className="of-enter mx-auto flex max-w-[560px] flex-col items-center pt-10 text-center sm:pt-16">
      <Card className="w-full px-8 py-10 sm:px-12 sm:py-12">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px]"
          style={{ background: theme.accentTint, color: theme.accentDeep }}
        >
          <OtterFace size={30} />
        </div>
        <span
          className="mt-5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.07em]"
          style={{ background: theme.accentTint, color: theme.accentDeep }}
        >
          <Lock className="h-3 w-3" strokeWidth={2.4} />
          {PLAN_META[tier].name} feature
        </span>
        <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-[var(--color-of-ink)]">
          {copy.title}
        </h2>
        <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-relaxed text-[var(--color-of-muted)]">
          {copy.blurb}
        </p>

        <ul className="mx-auto mt-6 flex max-w-[300px] flex-col gap-2.5 text-left">
          {copy.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                style={{ background: theme.accentTint, color: theme.accentDeep }}
              >
                <Check className="h-3 w-3" strokeWidth={2.6} />
              </span>
              <span className="text-[13.5px] leading-snug text-[var(--color-of-ink)]">{perk}</span>
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          onClick={() => openPaywall(feature)}
          className="mt-8 w-full font-semibold sm:w-auto sm:px-10"
          style={{ background: theme.accent }}
        >
          Upgrade to {PLAN_META[tier].name}
        </Button>
      </Card>
    </div>
  );
}
