"use client";

// otterfund — donut chart.
//
// A hand-built SVG donut in the same idiom as ProgressRing: it self-animates on
// mount — one continuous clockwise fill from 12 o'clock, each slice's transition
// delayed by its start angle and sized to its share so the fill front moves at
// constant angular speed — and respects reduced-motion. Segments are drawn as
// arcs of one stroked circle via strokeDasharray, so there are no external chart
// deps. Colors are passed in by the caller (derived from the active accent).
// Each slice's fill is fine engraved guilloché line-work (see ring-texture) —
// a paper tint ruled with the design system's banknote wave field in the slice's
// ink — so the band reads like currency zoomed in: crisp, fine lines, framed by
// sharp inked rims + dividers. Optional centered content renders upright over
// the ring.
//
// Pass `formatValue` to make it interactive: slices become hoverable and show a
// tooltip (label · formatted value · percent), dimming the others. It's opt-in,
// so static callers are unaffected.

import { useEffect, useId, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import { GuillocheHatch, rimInk } from "@/components/otterfund/ring-texture";

export interface DonutSegment {
  value: number;
  color: string;
  label?: string;
}

// Total duration of the mount fill — the full ring, regardless of slice count.
const SWEEP_MS = 900;

export function DonutChart({
  segments,
  size = 168,
  stroke = 24,
  trackColor = "var(--color-of-track)",
  children,
  formatValue,
  onSelect,
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  trackColor?: string;
  children?: React.ReactNode;
  /** When provided, slices become hoverable and show a tooltip
      (label · formatValue(value) · percent). Opt-in — omit for a static ring. */
  formatValue?: (value: number) => string;
  /** When provided, slices become clickable and report their index. */
  onSelect?: (index: number) => void;
}) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const [filled, setFilled] = useState(false);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const interactive = typeof formatValue === "function";
  // Unique per instance so the pattern/gradient ids don't collide when two
  // donuts share a page (e.g. Spending's Target + Spent). Strip the colons
  // useId emits so the fragment refs in url(#…) stay clean.
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    if (reduced) {
      setFilled(true);
      return;
    }
    const raf = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  // Pull the band in a hair so the sharp inked rim never clips the svg edge (the
  // plain band used to sit flush against it).
  const pad = 3;
  const r = (size - stroke) / 2 - pad;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const rin = r - stroke / 2; // inner band edge — inner rim + divider start
  const rout = r + stroke / 2; // outer band edge — outer rim + divider end
  const ink = rimInk(segments[0]?.color ?? "oklch(48% 0.115 158)");
  // Cumulative value at each visible slice's start — where a divider is inked.
  const bounds: number[] = [];
  {
    let acc = 0;
    for (const s of segments) {
      const v = Math.max(0, s.value);
      if (v > 0) {
        bounds.push(acc);
        acc += v;
      }
    }
  }
  // Per-slice arc geometry, computed once and shared by the visual (hatched,
  // filtered) circles and the transparent hit layer that owns interaction.
  let accLen = 0;
  const slices = segments.map((seg) => {
    const v = Math.max(0, seg.value);
    const len = total > 0 ? (v / total) * circ : 0;
    const begin = accLen;
    accLen += len;
    return { v, len, begin, offset: -begin };
  });

  // Cursor position relative to the (unrotated) wrapper, for the tooltip.
  const at = (e: React.MouseEvent, i: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ i, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const hovered = interactive && hover ? segments[hover.i] : null;

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
      onMouseLeave={interactive ? () => setHover(null) : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <defs>
          {segments.map((seg, i) => (
            <GuillocheHatch key={i} id={`${uid}-s${i}`} color={seg.color} />
          ))}
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {total > 0 &&
          slices.map(({ v, len, begin, offset }, i) => {
            if (v <= 0) return null;
            const dash = filled
              ? `${len.toFixed(2)} ${(circ - len).toFixed(2)}`
              : `0 ${circ.toFixed(2)}`;
            const dim = interactive && hover != null && hover.i !== i;
            // One clockwise fill: each slice starts when the fill front reaches
            // it (delay ∝ start angle) and draws for its share of the total
            // sweep (duration ∝ length), linear so the front never stalls.
            const delay = (begin / circ) * SWEEP_MS;
            const dur = (len / circ) * SWEEP_MS;
            return (
              <circle
                key={i}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={`url(#${uid}-s${i})`}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={offset.toFixed(2)}
                style={{
                  opacity: dim ? 0.45 : 1,
                  transition: reduced
                    ? "opacity .15s"
                    : `stroke-dasharray ${dur.toFixed(0)}ms linear ${delay.toFixed(0)}ms, opacity .15s`,
                }}
              />
            );
          })}
        {/* Sharp, fine inked rims + dividers frame the band — crisp banknote
            border. Non-interactive so hover passes through to the slices. */}
        {total > 0 && (
          <g fill="none" stroke={ink} strokeLinecap="round" style={{ pointerEvents: "none" }}>
            <circle cx={c} cy={c} r={rout} strokeOpacity={0.72} strokeWidth={1.3} />
            <circle cx={c} cy={c} r={rin} strokeOpacity={0.72} strokeWidth={1.3} />
            {bounds.map((b, i) => {
              const a = (b / total) * 2 * Math.PI;
              const cos = Math.cos(a);
              const sin = Math.sin(a);
              return (
                <line
                  key={i}
                  x1={(c + rin * cos).toFixed(2)}
                  y1={(c + rin * sin).toFixed(2)}
                  x2={(c + rout * cos).toFixed(2)}
                  y2={(c + rout * sin).toFixed(2)}
                  strokeOpacity={0.75}
                  strokeWidth={1.4}
                />
              );
            })}
          </g>
        )}
        {/* Transparent hit layer on top, so hover + click read cleanly without
            the pattern fills or rims getting in the way. */}
        {total > 0 &&
          (interactive || onSelect) &&
          slices.map(({ v, len, offset }, i) =>
            v <= 0 ? null : (
              <circle
                key={i}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${len.toFixed(2)} ${(circ - len).toFixed(2)}`}
                strokeDashoffset={offset.toFixed(2)}
                onMouseEnter={interactive ? (e) => at(e, i) : undefined}
                onMouseMove={interactive ? (e) => at(e, i) : undefined}
                onClick={onSelect ? () => onSelect(i) : undefined}
                style={{ cursor: onSelect || interactive ? "pointer" : "default", pointerEvents: "stroke" }}
              />
            ),
          )}
      </svg>
      {children != null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            textAlign: "center",
            // Let hover events reach the slices underneath — the centre label
            // must not swallow the pointer (otherwise the tooltip never fires).
            pointerEvents: "none",
          }}
        >
          {children}
        </div>
      )}
      {hovered && hovered.label && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            left: hover!.x,
            top: hover!.y,
            transform: "translate(-50%, calc(-100% - 12px))",
            pointerEvents: "none",
            zIndex: 40,
            background: "oklch(26% 0.012 75)",
            color: "#fff",
            borderRadius: 10,
            padding: "7px 10px",
            boxShadow: "0 8px 24px oklch(20% 0.02 80 / 0.3)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: hovered.color, flexShrink: 0 }} />
            {hovered.label}
          </div>
          <div className="of-num" style={{ fontSize: 12, marginTop: 2, color: "oklch(85% 0.01 80)" }}>
            {formatValue!(hovered.value)} · {total > 0 ? Math.round((Math.max(0, hovered.value) / total) * 100) : 0}%
          </div>
        </div>
      )}
    </div>
  );
}
