"use client";

// The upgrade interstitial. When a Free (or under-tier) user triggers a gated
// action — Connect a bank, Add an investment — the chrome's `requireFeature`
// gate opens THIS modal instead of jumping straight to pricing: it names the
// feature, the tier that unlocks it, and what they get, then its one CTA carries
// them to the pricing page. Copy is the single source in lib/plans (FEATURE_COPY
// + FEATURE_REQUIRED_TIER), the same data the full-page LockedFeature panel uses,
// so the two upsell surfaces never drift.

import { ArrowRight, Check, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OtterFace } from "@/components/otterfund/logo";
import { Wordmark } from "@/components/otterfund/wordmark";
import { GuillocheFlow } from "@/components/otterfund/guilloche-flow";
import type { OtterfundTheme } from "@/components/otterfund/theme";
import { FEATURE_COPY, FEATURE_REQUIRED_TIER, PLAN_META, type Feature } from "@/lib/plans";

const SERIF: React.CSSProperties = { fontFamily: "var(--font-num), Georgia, serif" };

export function PaywallModal({
  open,
  feature,
  theme,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  /** The gated feature to upsell — null when the modal is closed. */
  feature: Feature | null;
  theme: OtterfundTheme;
  onClose: () => void;
  /** Proceed to pricing (chrome's promptUpgrade). */
  onUpgrade: () => void;
}) {
  // Guard the null render — the modal stays mounted (open toggles) but `feature`
  // is null while closed, so there's nothing to look up yet.
  if (!feature) return null;
  const copy = FEATURE_COPY[feature];
  const tier = FEATURE_REQUIRED_TIER[feature];
  const tierName = PLAN_META[tier].name;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[440px] sm:p-0">
        {/* ── Header — accent-tint field with a faint drifting guilloché (the
             brand's banknote texture), the otter mark, the tier chip, and the
             feature title set in Newsreader like every display heading. ── */}
        <div
          className="relative overflow-hidden px-8 pt-9 pb-8 text-center"
          style={{ background: `linear-gradient(180deg, ${theme.accentTintBorder} 0%, ${theme.accentTint} 80%, transparent 100%)` }}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <GuillocheFlow accent={theme.accent} accentDeep={theme.accentDeep} opacity={0.08} fade="radial" speed={3} />
          </div>
          <div className="relative">
            <div className="mx-auto flex items-center justify-center" style={{ color: theme.accentDeep }}>
              <OtterFace size={40} />
            </div>
            <span
              className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: theme.accentDeep }}
            >
              <Lock className="h-3 w-3" strokeWidth={2.4} />
              {tierName} feature
            </span>
            <DialogTitle
              className="mt-3 text-[26px] leading-[1.1] tracking-[-0.02em] text-[var(--color-of-ink)]"
              style={{ ...SERIF, fontWeight: 500 }}
            >
              {copy.title}
            </DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-[340px] text-[13.5px] leading-relaxed text-[var(--color-of-muted)]">
              {copy.blurb}
            </DialogDescription>
          </div>
        </div>

        {/* ── Perks + CTA on the warm surface. ── */}
        <div className="px-8 pt-6 pb-8">
          <ul className="mx-auto flex max-w-[320px] flex-col gap-3">
            {copy.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5">
                <span
                  className="mt-[1px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full"
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
            onClick={onUpgrade}
            className="mt-7 w-full font-semibold"
            style={{ background: theme.accent }}
          >
            Upgrade to {tierName} <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="link" size="sm" onClick={onClose} className="mx-auto mt-3 flex text-[12.5px]">
            Maybe later
          </Button>
          <p className="mt-4 text-center text-[11.5px] text-[var(--color-of-faint)]">
            Cancel anytime ·{" "}
            <Wordmark />
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
