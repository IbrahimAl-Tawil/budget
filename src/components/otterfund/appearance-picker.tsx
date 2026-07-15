"use client";

// otterfund appearance picker.
//
// The Settings → Appearance theme control: System / Light / Dark as three
// selectable preview tiles, each a tiny mock of the app rendered in that scheme
// (System shows a light/dark diagonal split, the way native pickers do). Active
// tile is ringed in the live accent with a check. The palettes below mirror the
// canvas/surface/line/ink tokens in globals.css (light `:root` + `.dark`) so the
// preview is a truthful dry run — it must show all three at once, so it can't
// read the live `.dark` class and hardcodes the two palettes instead.

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { hueOf, type AppearanceMode } from "@/components/otterfund/theme";

interface Palette {
  canvas: string;
  surface: string;
  line: string;
  bar: string;
}

const LIGHT: Palette = {
  canvas: "oklch(96.5% 0.006 90)",
  surface: "oklch(99.2% 0.003 95)",
  line: "oklch(92% 0.006 85)",
  bar: "oklch(88% 0.006 85)",
};
const DARK: Palette = {
  canvas: "oklch(20.5% 0.006 75)",
  surface: "oklch(27% 0.008 75)",
  line: "oklch(33% 0.008 75)",
  bar: "oklch(40% 0.008 75)",
};

const OPTIONS: { value: AppearanceMode; label: string; Icon: typeof Monitor }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

/** The mini dashboard mock, drawn in one palette. `accent` colours the pill. */
function Mock({ p, accent }: { p: Palette; accent: string }) {
  return (
    <div className="absolute inset-0 flex flex-col gap-1.5 p-2.5" style={{ background: p.canvas }}>
      {/* header: accent dot + a couple of faint bars */}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
        <span className="h-1.5 flex-1 rounded-full" style={{ background: p.bar, maxWidth: 34 }} />
      </div>
      {/* a surface card with two lines + an accent pill */}
      <div
        className="flex-1 rounded-md p-2"
        style={{ background: p.surface, border: `1px solid ${p.line}` }}
      >
        <span className="block h-1.5 w-3/5 rounded-full" style={{ background: p.bar }} />
        <span className="mt-1.5 block h-1.5 w-2/5 rounded-full" style={{ background: p.bar }} />
        <span
          className="mt-2 block h-2.5 w-1/2 rounded-full"
          style={{ background: accent, opacity: 0.9 }}
        />
      </div>
    </div>
  );
}

export function AppearancePicker({
  value,
  onChange,
  accent,
}: {
  value: AppearanceMode;
  onChange: (mode: AppearanceMode) => void;
  /** Live accent (oklch) — the pill in each preview + the active ring/check. */
  accent: string;
}) {
  // A touch lighter accent reads better on the dark mock; mirrors deriveTheme's
  // night intent (fills stay rich, tints/text lift).
  const darkAccent = `oklch(66% 0.13 ${hueOf(accent)})`;

  return (
    <div className="grid grid-cols-3 gap-3 max-w-[440px]">
      {OPTIONS.map(({ value: v, label, Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={active}
            className="group flex flex-col gap-2 rounded-2xl border p-2 text-left outline-none transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
            style={{
              borderColor: active ? accent : "var(--color-of-line)",
              boxShadow: active ? `0 0 0 1px ${accent}` : "none",
              background: "var(--color-of-surface)",
            }}
          >
            {/* preview window */}
            <div
              className="relative h-[70px] w-full overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--color-of-line)" }}
            >
              {v === "light" && <Mock p={LIGHT} accent={accent} />}
              {v === "dark" && <Mock p={DARK} accent={darkAccent} />}
              {v === "system" && (
                <>
                  <Mock p={LIGHT} accent={accent} />
                  {/* dark half, clipped to a diagonal — the classic "auto" split */}
                  <div
                    className="absolute inset-0"
                    style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
                  >
                    <Mock p={DARK} accent={darkAccent} />
                  </div>
                  {/* hairline seam along the diagonal */}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(45deg, transparent calc(50% - 0.5px), oklch(100% 0 0 / 0.25) 50%, transparent calc(50% + 0.5px))",
                    }}
                  />
                </>
              )}
            </div>

            {/* label row */}
            <div className="flex items-center gap-1.5 px-0.5 pb-0.5">
              <Icon
                className="h-3.5 w-3.5 shrink-0"
                strokeWidth={2}
                style={{ color: active ? "var(--color-primary)" : "var(--color-of-muted)" }}
              />
              <span
                className="flex-1 text-[12.5px] font-semibold"
                style={{ color: active ? "var(--color-of-ink)" : "var(--color-of-muted)" }}
              >
                {label}
              </span>
              {active && (
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: accent, color: "#fff" }}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
