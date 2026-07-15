"use client";

// otterfund — the "statement" primitives.
//
// The fluent page grammar shared by overview / transactions / accounts / goals:
// a single reading column (<Statement>), one engraved hero moment (<HeroBand>),
// section headers that float on the canvas (<SectionHead>), and the hairline
// <Ledger>/<Row> list that replaces every bordered list-in-a-box. Row styling —
// the hover wash and the inter-row rule — lives in globals.css (.of-ledger /
// .of-row / .of-row-tap) so there is ONE source of truth; these components just
// compose those classes with the design system's serif figures and guilloché.

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { GuillocheFlow } from "@/components/otterfund/guilloche-flow";
import type { OtterfundTheme } from "@/components/otterfund/theme";
import { Button } from "@/components/ui/button";

/** The balanced reading column (860px). Wraps a page's content; fades up on mount. */
export function Statement({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`of-enter of-statement${className ? " " + className : ""}`} style={style}>
      {children}
    </div>
  );
}

type Fade = "left" | "right" | "radial" | "top" | "bottom" | "none";

/**
 * The one engraved moment on a page: a serif figure floating over a live
 * guilloché field, seated on the paper by a hairline "cut". Flexible enough for
 * every page's hero — pass a sparkline or action buttons as `aside`, a full-width
 * element (e.g. the accounts sparkline) as `below`.
 */
export function HeroBand({
  theme,
  eyebrow,
  figure,
  meta,
  aside,
  asideGrow = false,
  asideAlign = "end",
  below,
  divider = true,
  guillocheFade = "left",
  ariaLabel,
}: {
  theme: OtterfundTheme;
  /** Small label or a control (e.g. the net-worth / cash-flow toggle). */
  eyebrow?: ReactNode;
  /** The big serif figure — already formatted (and tweened, if the page tweens). */
  figure: ReactNode;
  /** Line under the figure — a trend pill, a caption. */
  meta?: ReactNode;
  /** Right-hand content — a sparkline (set asideGrow) or action buttons. */
  aside?: ReactNode;
  /** Give the aside a full grid column (sparkline) vs. sizing to content (actions). */
  asideGrow?: boolean;
  asideAlign?: "start" | "end";
  /** Full-width element under the figure row, above the cut (e.g. a wide sparkline). */
  below?: ReactNode;
  /** Render the hairline cut beneath the band. */
  divider?: boolean;
  guillocheFade?: Fade;
  ariaLabel?: string;
}) {
  const columns = aside ? (asideGrow ? "minmax(0, 1.15fr) minmax(0, 1fr)" : "minmax(0, 1fr) auto") : "1fr";
  const align = asideAlign === "end" ? "end" : "start";
  return (
    <>
      <section
        aria-label={ariaLabel}
        className="of-hero"
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: columns,
          gap: 26,
          alignItems: align,
          padding: "2px 0 22px",
        }}
      >
        {/* engraved field — clipped to the band so a sparkline tooltip can still overflow the edges */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <GuillocheFlow accent={theme.accent} accentDeep={theme.accentDeep} fade={guillocheFade} opacity={0.12} speed={5} />
        </div>
        <div style={{ position: "relative", minWidth: 0 }}>
          {eyebrow}
          <div
            className="of-num"
            style={{
              fontSize: "clamp(38px, 4.6vw, 52px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginTop: eyebrow ? 14 : 0,
            }}
          >
            {figure}
          </div>
          {meta && <div style={{ marginTop: 14 }}>{meta}</div>}
        </div>
        {aside && (
          <div style={{ position: "relative", minWidth: 0, alignSelf: align === "end" ? "end" : "start" }}>{aside}</div>
        )}
      </section>
      {below && <div style={{ position: "relative", paddingBottom: 22 }}>{below}</div>}
      {divider && <div className="of-cut" />}
    </>
  );
}

/** A section header floating on the canvas: title + optional trailing action. */
export function SectionHead({
  title,
  action,
  style,
}: {
  title: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 6,
        ...style,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--color-of-ink)" }}>
        {title}
      </h3>
      {action}
    </div>
  );
}

/** The single-accent "View all →" link used in section headers — the design
    system's `link` button variant (hover fade + focus underline), so every
    cross-page link on the app reads identically. */
export function ViewAllLink({ label = "View all", onClick }: { label?: string; onClick?: () => void }) {
  return (
    <Button variant="link" size="sm" onClick={onClick} className="text-[12.5px]">
      {label} <span aria-hidden="true">→</span>
    </Button>
  );
}

/** A hairline ledger — rows directly on the canvas. */
export function Ledger({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="of-ledger" style={style}>
      {children}
    </div>
  );
}

/**
 * One ledger row. Static by default; pass `onClick` to make it a keyboard-
 * accessible button that lights with the accent wash on hover/focus. Layout is
 * driven by `columns` (grid-template-columns) + `gap`.
 */
export function Row({
  columns,
  gap = 14,
  padding = "11px 12px",
  onClick,
  selected = false,
  ariaLabel,
  children,
  className,
  style,
}: {
  columns: string;
  gap?: number;
  padding?: string;
  onClick?: () => void;
  /** Persistent accent wash (e.g. a bulk-selected transaction row). */
  selected?: boolean;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const tap = typeof onClick === "function";
  const onKeyDown = tap
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick!();
        }
      }
    : undefined;
  return (
    <div
      className={`of-row${tap ? " of-row-tap" : ""}${className ? " " + className : ""}`}
      role={tap ? "button" : undefined}
      tabIndex={tap ? 0 : undefined}
      aria-label={ariaLabel}
      data-selected={selected ? "true" : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={{ gridTemplateColumns: columns, gap, padding, margin: "0 -12px", ...style }}
    >
      {children}
    </div>
  );
}
