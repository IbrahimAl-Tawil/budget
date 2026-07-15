"use client";

// otterfund — ring banknote texture.
//
// Fills the donut's band with fine engraved guilloché line-work — the same
// engine-turned wave field the design system draws behind Panels (see
// waveField() in guilloche.tsx) — so the ring reads like currency zoomed in:
// crisp, fine, engraved lines. No hand-drawn wobble.
//
// Each slice is a light paper tint of its hue, ruled with finer ink lines in the
// same hue (two tones, alternating, for the woven look). Tones derive per-slice
// so it re-tints with every accent scheme, and the slice's relative lightness is
// preserved so the chart still communicates without relying on the lines alone.

import { hueOf } from "@/components/otterfund/theme";

// One tileable engine-turned tile. The angular frequency and per-row phase drift
// are chosen so the tile repeats seamlessly on both axes: an integer number of
// wave cycles across the width, and a total phase drift of exactly 2π down the
// height. Mirrors the field in guilloche.tsx, made periodic so it can tile.
const TILE_W = 48;
const ROWS = 10;
const ROW_GAP = 3.2;
const TILE_H = ROWS * ROW_GAP; // 32
const CYCLES = 4;
const OMEGA = (2 * Math.PI * CYCLES) / TILE_W;
const AMP = 1.1;
const PHASE_STEP = (2 * Math.PI) / ROWS;

function fieldPaths(): string[] {
  const paths: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    const y0 = r * ROW_GAP + ROW_GAP / 2;
    const phase = r * PHASE_STEP;
    const pts: string[] = [];
    for (let x = 0; x <= TILE_W; x += 3) {
      // Sum of two harmonics (both integer cycles) so neighbouring rows weave.
      const y = y0 + AMP * Math.sin(OMEGA * x + phase) + AMP * 0.4 * Math.sin(2 * OMEGA * x + phase);
      pts.push(`${x} ${y.toFixed(2)}`);
    }
    paths.push("M" + pts.join("L"));
  }
  return paths;
}
// Computed once at module load — pure math, deterministic (SSR-safe).
const FIELD = fieldPaths();

/** Parse `oklch(L% C H)`; null for anything we can't read, so callers fall back. */
function parseOklch(s: string): { l: number; c: number; h: number } | null {
  const m = s.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return null;
  return { l: +m[1], c: +m[2], h: +m[3] };
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Paper tint + two ink tones for one slice, from its source colour. */
export function inkTones(color: string): { paper: string; ink: string; inkDeep: string } {
  const p = parseOklch(color);
  if (!p) {
    return {
      paper: `color-mix(in oklch, ${color} 22%, white)`,
      ink: `color-mix(in oklch, ${color} 72%, black)`,
      inkDeep: `color-mix(in oklch, ${color} 88%, black)`,
    };
  }
  const { l, c, h } = p;
  // Track the source lightness closely rather than washing everything toward
  // white, so neighbouring slices stay clearly distinct — a deeper slice keeps a
  // deeper tint, a lighter one a paler tint — and keep enough chroma that hue
  // steps read too.
  const paperL = l + (94 - l) * 0.55; // lighten, but keep the spread
  const inkL = clamp(l * 0.6, 22, 52); // pushed dark, ordering kept
  return {
    paper: `oklch(${paperL.toFixed(1)}% ${(c * 0.62).toFixed(3)} ${h})`,
    ink: `oklch(${inkL.toFixed(1)}% ${(c * 1.05).toFixed(3)} ${h})`,
    inkDeep: `oklch(${(inkL * 0.8).toFixed(1)}% ${(c * 1.15).toFixed(3)} ${h})`,
  };
}

/** One slice's fill: a paper-tinted tile ruled with the fine guilloché field in
    the slice's ink. Reference it as `stroke={`url(#${id})`}`. */
export function GuillocheHatch({
  id,
  color,
  angle = 25,
}: {
  id: string;
  color: string;
  angle?: number;
}) {
  const { paper, ink, inkDeep } = inkTones(color);
  return (
    <pattern id={id} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
      <rect width={TILE_W} height={TILE_H} style={{ fill: paper }} />
      {FIELD.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          style={{ stroke: i % 2 ? ink : inkDeep }}
          strokeWidth={0.6}
          strokeLinecap="round"
          strokeOpacity={0.85}
        />
      ))}
    </pattern>
  );
}

/** A deep ink derived from a slice colour, for the rims + dividers. */
export function rimInk(color: string): string {
  return `oklch(31% 0.07 ${hueOf(color)})`;
}
