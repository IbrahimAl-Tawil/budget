// otterfund — the minted statement panel.
//
// A bordered surface card with a unique engraved texture: the brand's
// engine-turned guilloché line-work bleeds from the top-right corner and fades
// out, giving each card a subtle minted "watermark" that never fights the
// content. A soft lift shadow seats the card just off the canvas. The texture
// derives from the active accent, so it re-tints with the theme like everything
// else. Pass `hover` to make a tappable card spring up on hover/focus.
//
// This is the ONE source of truth for the textured-card look (overview trio +
// section panels, goal cards); style it here and it updates everywhere.

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { GuillochePattern } from "@/components/otterfund/guilloche";
import type { OtterfundTheme } from "@/components/otterfund/theme";
import { cn } from "@/lib/utils";

// Texture concentrated in the top-right corner, faded to nothing by ~58% so the
// content area stays clean.
const CORNER_MASK = "radial-gradient(125% 125% at 100% 0%, #000 0%, transparent 58%)";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  theme: OtterfundTheme;
  /** Inner padding — string ("22px 24px") or number. */
  padding?: string | number;
  /** Spring-lift on hover/focus (for tappable cards). */
  hover?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Panel({ theme, padding = "22px 24px", hover = false, className, style, children, ...rest }: PanelProps) {
  return (
    <div
      className={cn("of-panel", hover && "of-panel-tap", className)}
      style={{
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
        borderRadius: 20,
        background: "var(--color-of-surface)",
        padding,
        ...style,
      }}
      {...rest}
    >
      <GuillochePattern
        accent={theme.accent}
        accentDeep={theme.accentDeep}
        variant="waves"
        fade="none"
        opacity={0.07}
        style={{ maskImage: CORNER_MASK, WebkitMaskImage: CORNER_MASK }}
      />
      <div style={{ position: "relative", minWidth: 0 }}>{children}</div>
    </div>
  );
}
