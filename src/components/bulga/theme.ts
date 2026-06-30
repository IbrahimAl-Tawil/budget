// Bulga design system — accent theming.
//
// The whole palette derives from ONE accent hue: deep tone, soft fill, badge
// backgrounds, the net-worth chart and every progress bar follow the hue you
// pick, so the brand stays cohesive whichever scheme is active. This mirrors
// one accent hue, derived into a cohesive palette.

export const DEFAULT_ACCENT = "oklch(48% 0.115 158)"; // Evergreen

/**
 * The Bulga logo green — fixed forever, independent of the active accent. The
 * brand mark must read as the same evergreen no matter which theme the user
 * picks in the Brand kit, so the logo pins to this rather than `--bk-accent`.
 */
export const LOGO_GREEN = "oklch(48% 0.115 158)";

/** The eight curated accent schemes shown in the Brand kit picker. */
export const SCHEMES: { name: string; value: string }[] = [
  { name: "Evergreen", value: "oklch(48% 0.115 158)" },
  { name: "Pine", value: "oklch(50% 0.09 195)" },
  { name: "Ocean", value: "oklch(52% 0.11 232)" },
  { name: "Indigo", value: "oklch(49% 0.12 268)" },
  { name: "Violet", value: "oklch(50% 0.13 300)" },
  { name: "Plum", value: "oklch(48% 0.13 348)" },
  { name: "Coral", value: "oklch(57% 0.14 30)" },
  { name: "Bronze", value: "oklch(54% 0.1 70)" },
];

/** Pull the hue (3rd oklch component) out of an `oklch(L C H)` string. */
export function hueOf(accent: string): string {
  const parts = accent.replace(/oklch\(|\)/gi, "").trim().split(/[\s,/]+/);
  return parts[2] ?? "158";
}

export interface BulgaTheme {
  accent: string;        // the raw accent (a.k.a. "green")
  accentDeep: string;    // deep tone for figures / emphasis
  accentTint: string;    // soft fill for insight card, badges
  accentTintBorder: string;
  clay: string;          // alert / negative
  clayTint: string;
  ink: string;
  muted: string;
}

/** Derive the full cohesive theme from a single accent. */
export function deriveTheme(accent: string = DEFAULT_ACCENT): BulgaTheme {
  const hue = hueOf(accent);
  return {
    accent,
    accentDeep: `oklch(38% 0.092 ${hue})`,
    accentTint: `oklch(95.5% 0.03 ${hue})`,
    accentTintBorder: `oklch(90% 0.045 ${hue})`,
    clay: "oklch(52% 0.14 33)",
    clayTint: "oklch(95% 0.04 38)",
    ink: "oklch(24% 0.012 70)",
    muted: "oklch(52% 0.012 80)",
  };
}

/**
 * Map the active theme onto the shadcn/base-ui `:root` tokens so the whole
 * primitive layer (Button, Input focus border, Badge, focus rings, accent
 * tints, chart-1) re-tints with the accent instead of staying evergreen.
 * Spread onto the shell root's `style` alongside `--bk-accent`. Note these
 * override the static `:root` values in globals.css for everything inside the
 * shell — the logo deliberately ignores them by pinning to LOGO_GREEN.
 */
export function themeVars(theme: BulgaTheme): Record<string, string> {
  return {
    "--bk-accent": theme.accent,
    "--primary": theme.accent,
    "--ring": theme.accent,
    "--accent": theme.accentTint,
    "--accent-foreground": theme.accentDeep,
    "--chart-1": theme.accent,
  };
}

/** Per-category tints for transaction / account avatars: [bg, ink]. */
export const CATEGORY_TINTS: Record<string, [string, string]> = {
  Groceries: ["oklch(94.5% 0.03 155)", "oklch(43% 0.08 155)"],
  Income: ["oklch(94.5% 0.035 158)", "oklch(40% 0.1 158)"],
  Subscriptions: ["oklch(94.5% 0.022 290)", "oklch(46% 0.07 290)"],
  Transport: ["oklch(94.5% 0.022 245)", "oklch(46% 0.06 245)"],
  Dining: ["oklch(95% 0.03 70)", "oklch(48% 0.07 60)"],
  "Dining out": ["oklch(95% 0.03 70)", "oklch(48% 0.07 60)"],
  Entertainment: ["oklch(95% 0.03 35)", "oklch(50% 0.09 35)"],
  Bills: ["oklch(94.5% 0.016 250)", "oklch(44% 0.05 250)"],
  Health: ["oklch(94.5% 0.025 190)", "oklch(44% 0.06 190)"],
  Housing: ["oklch(94.5% 0.02 100)", "oklch(45% 0.06 100)"],
};

const FALLBACK_TINT: [string, string] = ["oklch(95% 0.005 85)", "oklch(52% 0.012 80)"];

export function tintFor(category: string): [string, string] {
  return CATEGORY_TINTS[category] ?? FALLBACK_TINT;
}
