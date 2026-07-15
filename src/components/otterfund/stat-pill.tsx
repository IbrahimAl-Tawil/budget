"use client";

// otterfund — <StatPill>. The one rounded-full "figure + label" pill used across the
// app (net-worth change, budget remaining, subscriptions needing attention…).
//
// Centralising it fixes a spacing/baseline bug that kept recurring when each page
// hand-rolled the pill: a serif `.of-num` figure next to a sans label needs its
// OWN tuned gaps (tight after a leading icon, a hair wider before the label) and
// baseline alignment — otherwise the number floats and the spacing reads uneven.
// Change the rhythm here and every pill updates.

import type { ReactNode } from "react";
import type { OtterfundTheme } from "@/components/otterfund/theme";

type Tone = "accent" | "clay";

interface StatPillProps {
  /** The figure — a currency/number string. Rendered in the serif num face. */
  figure: ReactNode;
  /** Trailing label after the figure (e.g. "this month", "remaining"). */
  label?: ReactNode;
  /** Optional leading icon (svg). Sits tight against the figure. */
  icon?: ReactNode;
  /** Colour family. `accent` = soft accent tint; `clay` = alert tint. */
  tone?: Tone;
  /** Active theme (drives the tone colours). */
  theme: OtterfundTheme;
  /** Override the tint/ink directly instead of using a tone. */
  bg?: string;
  color?: string;
  fontSize?: number;
  /** Strip the pill — no background or padding, just the icon + figure + label
      inline (the tone still colours the text). Defaults to true: the app-wide
      look is a bare figure+label, no tinted pill behind it. Pass `bare={false}`
      to bring the tinted pill back (e.g. a design-system demo). */
  bare?: boolean;
}

export function StatPill({
  figure,
  label,
  icon,
  tone = "accent",
  theme,
  bg,
  color,
  fontSize = 13,
  bare = true,
}: StatPillProps) {
  const background = bare ? "transparent" : (bg ?? (tone === "clay" ? theme.clayTint : theme.accentTint));
  const ink = color ?? (tone === "clay" ? theme.clay : theme.accentDeep);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        padding: bare ? 0 : "5px 12px",
        borderRadius: bare ? 0 : 999,
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
        background,
        color: ink,
      }}
    >
      {icon && (
        <span
          aria-hidden="true"
          style={{ display: "inline-flex", alignSelf: "center", marginRight: 6 }}
        >
          {icon}
        </span>
      )}
      <span className="of-num" style={{ fontWeight: 600 }}>
        {figure}
      </span>
      {label != null && <span style={{ marginLeft: 5 }}>{label}</span>}
    </span>
  );
}
