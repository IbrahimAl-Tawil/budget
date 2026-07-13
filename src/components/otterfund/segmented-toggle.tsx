"use client";

// One segmented pill toggle for the whole app: the transactions-page styling
// (bordered surface track, accent-filled active segment, white label) with the
// insights-page motion (a single accent thumb that glides between segments).
// Used by the overview hero, the transactions filter, and the insights view
// switch so all three read as the same control.
import { useLayoutEffect, useRef, useState } from "react";
import type { OtterfundTheme } from "@/components/otterfund/theme";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  theme,
  ariaLabel,
  segWidth,
  stopPropagation,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  theme: OtterfundTheme;
  ariaLabel?: string;
  /** Force each segment to a fixed width (equal-width island, e.g. insights). */
  segWidth?: number;
  /** Swallow the click so a clickable parent (the hero card) doesn't also fire. */
  stopPropagation?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  const PAD = 4;

  useLayoutEffect(() => {
    const el = btnRefs.current[value];
    if (!el) return;
    setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options, segWidth]);

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: PAD,
        borderRadius: 999,
        border: "1px solid var(--color-of-line)",
        background: "var(--color-of-surface)",
      }}
    >
      {thumb && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: PAD,
            bottom: PAD,
            left: 0,
            width: thumb.width,
            transform: `translateX(${thumb.left}px)`,
            borderRadius: 999,
            background: theme.accent,
            transition: "transform 340ms cubic-bezier(.4,0,.2,1), width 340ms cubic-bezier(.4,0,.2,1)",
          }}
        />
      )}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(node) => {
              btnRefs.current[opt.value] = node;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={(e) => {
              if (stopPropagation) e.stopPropagation();
              onChange(opt.value);
            }}
            style={{
              position: "relative",
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              height: 34,
              padding: "0 16px",
              width: segWidth,
              border: "none",
              background: "transparent",
              borderRadius: 999,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: active ? "#fff" : "var(--color-of-muted)",
              transition: "color 200ms",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
