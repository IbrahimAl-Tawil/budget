"use client";

// Net-worth sparkline — the interactive line + hover tooltip shared by the
// Overview hero and the Accounts hero. Given the month-by-month trend it draws
// a gradient-filled line, an end-of-line marker, and a hover card reading out
// the point's month, net-worth value, and that month's change. Kept in one
// place so both surfaces stay pixel-identical and any tweak lands everywhere.

import { useState } from "react";
import type { NetWorthPoint } from "@/lib/types";
import type { OtterfundTheme } from "@/components/otterfund/theme";

// ── geometry (viewBox units; the SVG scales to its container) ──
const W = 620;
const H = 130;

interface SparkPoint {
  x: number;
  y: number;
  point: NetWorthPoint;
}

function sparkline(trend: NetWorthPoint[]) {
  const zero: NetWorthPoint = { label: "", value: 0, change: 0 };
  const data =
    trend.length >= 2
      ? trend
      : trend.length === 1
        ? [trend[0], trend[0]]
        : [zero, zero];
  const values = data.map((d) => d.value);
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const rg = mx - mn || 1;
  const pts: SparkPoint[] = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - 10 - ((d.value - mn) / rg) * (H - 28),
    point: d,
  }));
  const line = pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  return { line, area: `0,${H} ${line} ${W},${H}`, pts };
}

function NetWorthTooltip({
  pt,
  atStart,
  atEnd,
  theme,
  money,
  signed,
}: {
  pt: SparkPoint;
  atStart: boolean;
  atEnd: boolean;
  theme: OtterfundTheme;
  money: (n: number) => string;
  signed: (n: number) => string;
}) {
  const { change, value, label } = pt.point;
  const down = change < 0;
  // Anchor horizontally so edge points don't overflow the chart; drop the card
  // below the point when it sits high enough that a card above would clip.
  const anchorX = atStart ? "0%" : atEnd ? "-100%" : "-50%";
  const yPct = (pt.y / H) * 100;
  const anchorY = yPct < 46 ? "18px" : "calc(-100% - 14px)";
  const changeColor = change === 0 ? "var(--color-of-muted)" : down ? theme.clay : theme.accentDeep;

  return (
    <div
      style={{
        position: "absolute",
        left: `${(pt.x / W) * 100}%`,
        top: `${yPct}%`,
        transform: `translate(${anchorX}, ${anchorY})`,
        background: "var(--color-of-surface)",
        border: "1px solid var(--color-of-line)",
        borderRadius: 12,
        padding: "9px 12px",
        boxShadow: "0 8px 24px rgba(30,20,10,0.14)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 6,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-of-faint)",
        }}
      >
        {label}
      </div>
      <div className="of-num" style={{ fontSize: 19, letterSpacing: "-0.02em", marginTop: 3, lineHeight: 1.1 }}>
        {money(value)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 12, fontWeight: 600, color: changeColor }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={down ? "M7 7 17 17M9 17h8V9" : "M7 17 17 7M9 7h8v8"} />
        </svg>
        <span className="of-num">{signed(change)}</span>
        <span style={{ color: "var(--color-of-faint)", fontWeight: 500 }}>this month</span>
      </div>
    </div>
  );
}

/**
 * Interactive net-worth sparkline. Renders nothing meaningful for an empty
 * trend beyond a flat baseline, so callers can render it unconditionally.
 */
export function NetWorthSparkline({
  trend,
  theme,
  money,
  signed,
  height = 110,
}: {
  trend: NetWorthPoint[];
  theme: OtterfundTheme;
  money: (n: number) => string;
  signed: (n: number) => string;
  /** Rendered pixel height of the chart (viewBox is fixed; this is the box). */
  height?: number;
}) {
  const spark = sparkline(trend);
  const [hover, setHover] = useState<number | null>(null);
  const hoverPt = hover !== null ? spark.pts[hover] : null;
  const hasTrend = trend.length > 0;

  return (
    <div
      className="of-nw-spark"
      style={{ position: "relative", width: "100%", height }}
      onMouseLeave={() => setHover(null)}
      onMouseMove={
        hasTrend
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const idx = Math.max(
                0,
                Math.min(spark.pts.length - 1, Math.round(ratio * (spark.pts.length - 1))),
              );
              setHover(idx);
            }
          : undefined
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: "relative", width: "100%", height: "100%", display: "block" }} aria-hidden="true">
        <defs>
          <linearGradient id="of-nw-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.16" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M${spark.area}Z`} fill="url(#of-nw-grad)" />
        <polyline points={spark.line} fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* End-of-line marker (hidden while a hovered point is active). */}
      {hasTrend && !hoverPt && (
        <span
          style={{
            position: "absolute",
            left: `${(spark.pts[spark.pts.length - 1].x / W) * 100}%`,
            top: `${(spark.pts[spark.pts.length - 1].y / H) * 100}%`,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: theme.accent,
            border: "2px solid #fff",
            boxShadow: "0 1px 3px rgba(30,20,10,0.2)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      )}

      {hoverPt && (
        <>
          <span
            style={{
              position: "absolute",
              left: `${(hoverPt.x / W) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: "var(--color-of-line)",
              transform: "translateX(-0.5px)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: `${(hoverPt.x / W) * 100}%`,
              top: `${(hoverPt.y / H) * 100}%`,
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: theme.accent,
              border: "2.5px solid #fff",
              boxShadow: "0 1px 4px rgba(30,20,10,0.22)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
          <NetWorthTooltip
            pt={hoverPt}
            atStart={hover === 0}
            atEnd={hover === spark.pts.length - 1}
            theme={theme}
            money={money}
            signed={signed}
          />
        </>
      )}
    </div>
  );
}
