"use client";

// Bulga progress indicators — the one place the "fill sweeps from 0 on mount"
// pattern lives. Both self-animate: they start empty and ease to their value on
// first paint, so callers don't thread their own `mounted` flag. Colors default
// to the live accent (via the --bk-accent / --color-primary token) but accept an
// override (e.g. clay for over-budget).

import { useEffect, useState } from "react";

/** rAF-gated mount flag: false on first paint, true next frame → CSS tweens. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return mounted;
}

export interface ProgressBarProps {
  /** 0–100; clamped. */
  value: number;
  /** Fill color. Defaults to the live accent. */
  color?: string;
  /** Track thickness in px. */
  height?: number;
  /** Sweep duration in seconds. */
  duration?: number;
  className?: string;
}

/** Slim rounded track with an accent fill that sweeps to `value` on mount. */
export function ProgressBar({
  value,
  color = "var(--color-primary)",
  height = 6,
  duration = 0.9,
  className,
}: ProgressBarProps) {
  const mounted = useMounted();
  const pct = Math.max(0, Math.min(value, 100));
  return (
    <div
      className={className}
      style={{ height, borderRadius: 999, background: "var(--color-bk-track)", overflow: "hidden" }}
    >
      <div
        style={{
          height: "100%",
          width: mounted ? `${pct}%` : "0%",
          borderRadius: 999,
          background: color,
          transition: `width ${duration}s cubic-bezier(.22,.61,.36,1)`,
        }}
      />
    </div>
  );
}

export interface ProgressRingProps {
  /** 0–100; clamped. */
  value: number;
  /** Overall svg size in px. */
  size?: number;
  /** Stroke thickness in px. */
  stroke?: number;
  /** Arc color. Defaults to the live accent. */
  color?: string;
  /** Optional centered content (emoji, percentage, icon). */
  children?: React.ReactNode;
  className?: string;
}

/** Circular progress arc that sweeps to `value` on mount, with optional
    centered content. Geometry matches the goals-card ring. */
export function ProgressRing({
  value,
  size = 62,
  stroke = 6,
  color = "var(--color-primary)",
  children,
  className,
}: ProgressRingProps) {
  const mounted = useMounted();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(value, 100));
  const offset = mounted ? circ * (1 - clamped / 100) : circ;
  const c = size / 2;
  return (
    <div className={className} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="oklch(93% 0.005 85)" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)" }}
        />
      </svg>
      {children != null && (
        <span
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {children}
        </span>
      )}
    </div>
  );
}
