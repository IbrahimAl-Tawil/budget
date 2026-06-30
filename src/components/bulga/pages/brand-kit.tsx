"use client";

// Bulga BRAND KIT — the live design-system showcase.
//
// Translated from the design spec (lines 346-451). Every value derives from the
// active `accent` via deriveTheme(), so tapping a scheme retones the whole app:
// the picker just calls onAccentChange — the shell owns accent state and pushes
// it back down as `accent` + `theme`. No hardcoded sample data ships here.

import { useEffect, useState, type CSSProperties } from "react";

import { LogoMark } from "@/components/bulga/logo";
import { SchemePicker } from "@/components/bulga/scheme-picker";
import { LOGO_GREEN, type BulgaTheme } from "@/components/bulga/theme";
import { Button } from "@/components/ui/button";

interface BulgaBrandKitProps {
  accent: string;
  theme: BulgaTheme;
  onAccentChange: (accent: string) => void;
}

export function BulgaBrandKit({ accent, theme, onAccentChange }: BulgaBrandKitProps) {
  // Mirrors the reference's componentDidMount → mounted flag: bars/progress
  // sweep from 0 to their target on first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Live palette built from the active theme (section 3). "Logo green" is the
  // one fixed swatch — it never follows the accent.
  const palette: { name: string; role: string; value: string; fixed?: boolean }[] = [
    { name: "Canvas", role: "Background", value: "var(--color-bk-canvas)" },
    { name: "Surface", role: "Cards", value: "var(--color-bk-surface)" },
    { name: "Ink", role: "Text", value: theme.ink },
    { name: "Accent", role: "Themed", value: theme.accent },
    { name: "Soft fill", role: "Accent tint", value: theme.accentTint },
    { name: "Logo green", role: "Fixed", value: LOGO_GREEN, fixed: true },
    { name: "Clay", role: "Alert", value: theme.clay },
  ];

  const motions: { title: string; desc: string }[] = [
    { title: "Spring press", desc: "Buttons scale to 0.94 on tap, snap back with overshoot." },
    { title: "Nav highlight", desc: "Active item fills smoothly — always know where you are." },
    { title: "Bars grow", desc: "Progress sweeps left-to-right on every reveal." },
    { title: "Soft enter", desc: "Screens fade up 10px — calm, never jarring." },
  ];

  const muted = "oklch(54% 0.012 80)";
  const faint = "oklch(56% 0.012 80)";

  return (
    <div className="bk-enter" style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* ── 1 · logo lockup ── */}
      <section
        style={{
          background: "oklch(20% 0.014 75)",
          borderRadius: 24,
          padding: 52,
          marginBottom: 16,
        }}
      >
        <div>
          {/* The mark pins to LOGO_GREEN — it stays evergreen no matter which
              accent is active, the one fixed point in the system. */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LogoMark size={44} bg={LOGO_GREEN} fg="#fff" />
            <span
              style={{
                fontFamily: "var(--font-ui), system-ui, sans-serif",
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: "#fff",
              }}
            >
              Bulga
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-num), Georgia, serif",
              fontSize: 19,
              color: "oklch(82% 0.01 85)",
              margin: "22px 0 0",
              maxWidth: 380,
              lineHeight: 1.4,
            }}
          >
            Your money, in balance. Calm, confident budgeting that does the math
            so you don&apos;t have to.
          </p>
        </div>
      </section>

      {/* ── 2 · color schemes (LIVE PICKER) ── */}
      <section
        style={{
          background: "var(--color-bk-surface)",
          border: "1px solid var(--color-bk-line)",
          borderRadius: 20,
          padding: 28,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Color schemes</h3>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.accentDeep }}>
            Tap one — the whole app retones
          </span>
        </div>
        <p style={{ margin: "0 0 22px", fontSize: 13.5, color: muted }}>
          Pick an accent. Fills, badges, inputs, buttons, charts and progress
          follow it; the logo stays evergreen.
        </p>
        <SchemePicker accent={accent} onAccentChange={onAccentChange} />
      </section>

      {/* ── 3 · color palette (live) ── */}
      <section
        style={{
          background: "var(--color-bk-surface)",
          border: "1px solid var(--color-bk-line)",
          borderRadius: 20,
          padding: 28,
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Color</h3>
        <p style={{ margin: "0 0 22px", fontSize: 13.5, color: muted }}>
          Warm-neutral canvas, near-monochrome ink, one confident accent used
          sparingly. Clay flags only what needs attention.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
          {palette.map((p) => (
            <div key={p.name}>
              <div
                style={{
                  position: "relative",
                  height: 76,
                  borderRadius: 14,
                  background: p.value,
                  border: p.fixed
                    ? `1.5px solid ${LOGO_GREEN}`
                    : "1px solid oklch(90% 0.006 85 / 0.6)",
                }}
              >
                {p.fixed && (
                  <span
                    aria-hidden="true"
                    title="Fixed — never follows the accent"
                    style={{
                      position: "absolute",
                      top: 7,
                      right: 7,
                      display: "grid",
                      placeItems: "center",
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "oklch(100% 0 0 / 0.9)",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={LOGO_GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 9 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: faint, marginTop: 1 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4 + 5 · type / components two-up ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Type */}
        <div
          style={{
            background: "var(--color-bk-surface)",
            border: "1px solid var(--color-bk-line)",
            borderRadius: 20,
            padding: 28,
          }}
        >
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Type</h3>
          <div
            style={{
              borderBottom: "1px solid var(--color-bk-line-soft)",
              paddingBottom: 18,
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 11.5, color: faint, marginBottom: 6 }}>
              Newsreader · display &amp; figures
            </div>
            <div
              className="bk-num"
              style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              $154,291
            </div>
            <div style={{ fontFamily: "var(--font-num), Georgia, serif", fontSize: 22, marginTop: 8 }}>
              Money, made plain.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: faint, marginBottom: 8 }}>
              Hanken Grotesk · interface &amp; data
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em" }}>Heading · 700</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 5 }}>Subhead · 600</div>
            <div style={{ fontSize: 13.5, color: "oklch(40% 0.012 80)", marginTop: 5, lineHeight: 1.5 }}>
              Body copy stays friendly and plain — we explain, never lecture. 400
              weight at 13–15px.
            </div>
          </div>
        </div>

        {/* Components */}
        <div
          style={{
            background: "var(--color-bk-surface)",
            border: "1px solid var(--color-bk-line)",
            borderRadius: 20,
            padding: 28,
          }}
        >
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Components</h3>

          {/* Real ui/ primitives (the actual app buttons future devs build on),
              tinted to the live accent via inline vars so they retone too. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <Button
              style={
                {
                  background: theme.accent,
                  color: "#fff",
                  borderRadius: 999,
                  height: 38,
                  padding: "0 18px",
                } as CSSProperties
              }
            >
              Primary
            </Button>
            <Button variant="outline" style={{ borderRadius: 999, height: 38, padding: "0 18px" }}>
              Secondary
            </Button>
            <Button variant="ghost" style={{ borderRadius: 999, height: 38, color: theme.accent }}>
              Ghost →
            </Button>
          </div>

          {/* Raw pills — the showcase reference for the exact pill shape. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 18 }}>
            <button
              type="button"
              style={{
                height: 38,
                padding: "0 18px",
                borderRadius: 999,
                border: "none",
                background: theme.accent,
                color: "#fff",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform .14s cubic-bezier(.34,1.56,.64,1)",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
            >
              Primary
            </button>
            <button
              type="button"
              style={{
                height: 38,
                padding: "0 18px",
                borderRadius: 999,
                border: "1px solid oklch(86% 0.008 85)",
                background: "#fff",
                color: "oklch(28% 0.012 80)",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Secondary
            </button>
            <button
              type="button"
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 999,
                border: "none",
                background: "none",
                color: theme.accent,
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ghost →
            </button>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 999,
                background: theme.accentTint,
                color: theme.accentDeep,
              }}
            >
              + On track
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 999,
                background: theme.clayTint,
                color: theme.clay,
              }}
            >
              Due soon
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 999,
                background: "oklch(95% 0.005 85)",
                color: "oklch(46% 0.012 80)",
              }}
            >
              Neutral
            </span>
          </div>

          {/* Input field mock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              height: 42,
              padding: "0 16px",
              borderRadius: 13,
              border: "1px solid var(--color-bk-line)",
              background: "oklch(98% 0.004 90)",
              marginBottom: 14,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(58% 0.012 80)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span style={{ fontSize: 13.5, color: "oklch(58% 0.012 80)" }}>Input field</span>
          </div>

          {/* Progress bar — animates to ~64% on enter */}
          <div style={{ height: 6, borderRadius: 999, background: "var(--color-bk-track)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: mounted ? "64%" : "0%",
                borderRadius: 999,
                background: theme.accent,
                transition: "width 1s cubic-bezier(.22,.61,.36,1)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── 6 · motion & feel ── */}
      <section
        style={{
          background: "var(--color-bk-surface)",
          border: "1px solid var(--color-bk-line)",
          borderRadius: 20,
          padding: 28,
        }}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Motion &amp; feel</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13.5, color: muted }}>
          Snappy, never showy. Spring on press, ease on reveal — every action
          confirms itself.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {motions.map((mItem) => (
            <div
              key={mItem.title}
              style={{
                background: "oklch(98% 0.004 90)",
                border: "1px solid oklch(93% 0.005 85)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{mItem.title}</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 5, lineHeight: 1.45 }}>{mItem.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
