"use client";

// otterfund — auth brand panel.
//
// The pitch half of the split-screen auth layout. On the shared evergreen
// banknote field it floats a "note" that counts its net-worth figure up and
// draws its own sparkline on mount, so the emotional case is made while the
// form on the right stays clean. All motion degrades to a calm static state
// under prefers-reduced-motion.

import { useEffect, useRef, useState } from "react";

// Imported as a module (not referenced from /public) so Turbopack bundles and
// serves it with a hashed URL — a loose public/ file added while the dev server
// is already running isn't picked up until a restart.
import otterSwimSprite from "./otter-swim-sprite.png";
import {
  BrandPanelShell,
  PanelLockup,
  PANEL_INK,
  PANEL_MUTED,
  PANEL_ACCENT,
  PANEL_LINE,
  PANEL_LINE_DEEP,
  PANEL_HAIRLINE,
} from "@/components/otterfund/brand-panel";
import { waveField } from "@/components/otterfund/guilloche";
import { fmt } from "@/lib/format";

// ── live net-worth sparkline (illustrative, mirrors the real Overview) ──
const SP_W = 460;
const SP_H = 96;
const N_PTS = 56; // samples across the width — smooth curve
const WINDOW_SEC = 7; // seconds of history the width spans

// The chart is a live feed: a smoothly-varying "world" value sampled over a
// trailing window that scrolls left as time passes. A steady upward DRIFT makes
// it climb (growth) while a few incommensurate sines make it wobble
// (oscillation) — together, an oscillating-growth curve that never repeats.
const DRIFT = 0.9;
function worldVal(tau: number) {
  return (
    DRIFT * tau +
    2.4 * Math.sin(tau * 0.9) +
    1.4 * Math.sin(tau * 1.9 + 0.6) +
    0.9 * Math.sin(tau * 3.3 + 1.7)
  );
}

// Net-worth figure grows perpetually: base + NUM_RATE $/s, handed over from the
// intro count-up at NUM_DELAY so there's no jump.
const NUM_BASE = 24180.62;
const NUM_RATE = 0.7; // $/s — slow, but the cents keep ticking
const NUM_DELAY = 1.6;

// First-paint geometry (SSR markup + reduced-motion resting state): the newest
// WINDOW of the world curve at t=0, normalized into the viewBox.
function sparkAt(t: number, lo: number, hi: number) {
  const rg = hi - lo || 1;
  const dt = WINDOW_SEC / (N_PTS - 1);
  const coords: string[] = [];
  let lastX = 0;
  let lastY = 0;
  for (let i = 0; i < N_PTS; i++) {
    const v = worldVal(t - (N_PTS - 1 - i) * dt);
    const x = (i / (N_PTS - 1)) * SP_W;
    const y = Math.max(2, Math.min(SP_H - 2, SP_H - 6 - ((v - lo) / rg) * (SP_H - 20)));
    coords.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    lastX = x;
    lastY = y;
  }
  const line = "M" + coords.join("L");
  return { line, area: `${line}L${SP_W} ${SP_H}L0 ${SP_H}Z`, lx: lastX, ly: lastY };
}
// Range of the initial window, used both for first paint and as the seed for
// the smoothed auto-scaling in the rAF.
const SEED_LO = worldVal(-WINDOW_SEC);
const SEED_HI = worldVal(0);
const BASE_SPARK = sparkAt(0, SEED_LO, SEED_HI);

// The fill under the line is the panel's own guilloché wave-lines (same field,
// colours and dash as the background), clipped to the area so the chart reads
// as a window cut into that texture rather than a flat gradient.
const FILL_LINES = waveField(SP_W, SP_H, 12, 6, 0.045, 0.6);

/** Eased count-up toward `target` once `run` flips true; jumps to the final
    figure under reduced motion. */
function useCountUp(target: number, run: boolean, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, duration]);
  return value;
}

const STATS = [
  { label: "Income", value: 6450 },
  { label: "Spending", value: 4012.55 },
];

export function AuthBrandPanel() {
  // One flag drives the count-ups and flips `data-in` so the sparkline draws.
  const [live, setLive] = useState(false);
  const netWorth = useCountUp(NUM_BASE, live);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Live chart. The line scrolls left and trends upward forever; the area clip
  // follows so the guilloché fill tracks it, the end dot rides the tip, and the
  // net-worth figure climbs perpetually. All mutated directly (no re-render).
  // Frozen at the seed frame under reduced motion.
  const lineRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGPathElement>(null);
  const numRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    // Smoothed vertical range, seeded from the first window, so the auto-scale
    // eases as new highs/lows enter instead of snapping.
    let smLo = SEED_LO;
    let smHi = SEED_HI;
    const dt = WINDOW_SEC / (N_PTS - 1);
    const tick = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000;
      let wLo = Infinity;
      let wHi = -Infinity;
      const vals = new Array<number>(N_PTS);
      for (let i = 0; i < N_PTS; i++) {
        const v = worldVal(t - (N_PTS - 1 - i) * dt);
        vals[i] = v;
        if (v < wLo) wLo = v;
        if (v > wHi) wHi = v;
      }
      smLo += (wLo - smLo) * 0.05;
      smHi += (wHi - smHi) * 0.05;
      const pad = (smHi - smLo) * 0.14 || 1;
      const lo = smLo - pad;
      const rg = smHi + pad - lo || 1;
      const coords: string[] = [];
      for (let i = 0; i < N_PTS; i++) {
        const x = (i / (N_PTS - 1)) * SP_W;
        const y = Math.max(2, Math.min(SP_H - 2, SP_H - 6 - ((vals[i] - lo) / rg) * (SP_H - 20)));
        coords.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      const line = "M" + coords.join("L");
      lineRef.current?.setAttribute("d", line);
      clipRef.current?.setAttribute("d", `${line}L${SP_W} ${SP_H}L0 ${SP_H}Z`);
      if (numRef.current && t > NUM_DELAY) {
        numRef.current.textContent = fmt(NUM_BASE + NUM_RATE * (t - NUM_DELAY));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <BrandPanelShell>
      <PanelLockup />

      {/* ── pitch + showpiece ── */}
      <div className="relative flex max-w-[600px] flex-1 flex-col justify-center">
        <div
          className="of-enter"
          style={{
            animationDelay: "80ms",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: PANEL_ACCENT,
          }}
        >
          Personal budgeting, in balance
        </div>
        <h2
          className="of-enter mt-4 mb-9 text-balance"
          style={{
            animationDelay: "160ms",
            fontFamily: "var(--font-num), Georgia, serif",
            fontWeight: 500,
            fontSize: "clamp(30px, 3.4vw, 42px)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            color: PANEL_INK,
          }}
        >
          Every dollar,{" "}
          <em style={{ fontStyle: "italic", color: PANEL_ACCENT }}>accounted for.</em>
        </h2>

        {/* The floating net-worth note. */}
        <div
          data-in={live ? "" : undefined}
          className="of-enter relative overflow-hidden"
          style={{
            animationDelay: "260ms",
            background: "oklch(99% 0.01 95 / 0.07)",
            border: `1px solid ${PANEL_HAIRLINE}`,
            borderRadius: 30,
            padding: 30,
            backdropFilter: "blur(7px)",
            WebkitBackdropFilter: "blur(7px)",
            boxShadow: "0 30px 70px oklch(14% 0.03 158 / 0.45)",
          }}
        >
          <div className="flex items-start justify-between">
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: PANEL_MUTED,
              }}
            >
              Net worth
            </span>
            <span
              className="of-num"
              style={{ fontSize: 11, letterSpacing: "0.14em", color: PANEL_MUTED, opacity: 0.8 }}
            >
              SERIES 2026
            </span>
          </div>

          {/* Net-worth figure with the otter running alongside it in the card's
              open upper-right, centered on the figure's height so the two align.
              Fixed vertically so it never bobs. Shows from 2xl up, where the card
              is wide enough to sit the larger figure and the otter side by side. */}
          <div className="relative">
            <div
              ref={numRef}
              className="of-num"
              style={{ fontSize: 62, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 16, color: PANEL_INK }}
            >
              {fmt(netWorth)}
            </div>
            <div
              className="of-otter-swim pointer-events-none absolute hidden 2xl:block"
              style={{
                right: "clamp(0px, 1.5vw, 24px)",
                top: "50%",
                width: "clamp(104px, 6.5vw, 140px)",
                transform: "translateY(-50%)",
                backgroundImage: `url(${otterSwimSprite.src})`,
              }}
              aria-hidden
            />
          </div>

          <div className="relative mt-7">
            <svg viewBox={`0 0 ${SP_W} ${SP_H}`} preserveAspectRatio="none" className="h-[116px] w-full" aria-hidden>
              <defs>
                <clipPath id="auth-nw-clip">
                  <path ref={clipRef} d={BASE_SPARK.area} />
                </clipPath>
              </defs>
              {/* Fill = the panel's own guilloché wave-lines (same field, colour
                  and dash as the background), clipped to the area under the line. */}
              <g className="of-lp-area" clipPath="url(#auth-nw-clip)" opacity={0.55}>
                {FILL_LINES.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={i % 2 ? PANEL_LINE : PANEL_LINE_DEEP}
                    strokeWidth={0.85}
                    strokeDasharray="3 4.5"
                    strokeLinecap="round"
                  />
                ))}
              </g>
              <path
                ref={lineRef}
                className="of-lp-line"
                d={BASE_SPARK.line}
                pathLength={1}
                fill="none"
                stroke={PANEL_ACCENT}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl px-5 py-4"
                style={{ border: `1px solid ${PANEL_HAIRLINE}` }}
              >
                <div style={{ fontSize: 12.5, color: PANEL_MUTED }}>{s.label}</div>
                <div className="of-num mt-1" style={{ fontSize: 21, letterSpacing: "-0.02em", color: PANEL_INK }}>
                  {fmt(s.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrandPanelShell>
  );
}
