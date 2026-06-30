// Bulga brand mark.
//
// A high-contrast serif "B" with open (knockout) counters whose top terminal
// grows into a veined leaf sweeping up and to the right — a stylized, ownable
// letterform that ties the brand to growth. Sits in the brand's rounded-square
// lockup, reads cleanly from a 44px tile down to a 16px favicon. Monochrome-safe.

import { LOGO_GREEN } from "@/components/bulga/theme";

interface LogoMarkProps {
  size?: number;
  /** Background of the rounded square. Defaults to the fixed brand green —
      the mark stays evergreen even when the app accent is themed. */
  bg?: string;
  /** Color of the monogram. */
  fg?: string;
  className?: string;
}

/** The square lockup mark (icon tile) — used in the sidebar rail and favicon. */
export function LogoMark({ size = 30, bg = LOGO_GREEN, fg = "#fff", className }: LogoMarkProps) {
  const r = size * 0.3;
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.66}
        height={size * 0.66}
        viewBox="8 8 80 80"
        fill={fg}
        aria-hidden="true"
      >
        {/* serif B with knockout counters, slab serifs, and a veined leaf */}
        <g fillRule="evenodd">
          <path d="M26 26 H50 C62 26 70 32 70 42 C70 48 67 52 61 55 C69 57 74 62 74 70 C74 80 65 87 51 87 H26 Z M39 34 V51 H49 C56 51 60 48 60 42 C60 37 56 34 50 34 Z M39 60 V79 H50 C58 79 63 75 63 69 C63 64 58 60 51 60 Z" />
          <path d="M22 26 H46 V29 H22 Z" />
          <path d="M22 84 H46 V87 H22 Z" />
          <path d="M40 28 C48 14 66 8 84 10 C76 26 58 32 40 30 Z M46 27 C56 19 70 15 80 13 C68 18 56 23 46 27 Z" />
        </g>
      </svg>
    </div>
  );
}

interface WordmarkProps {
  /** Mark tile size; wordmark text scales with it. */
  size?: number;
  bg?: string;
  textColor?: string;
  className?: string;
}

/** Full lockup: mark + "Bulga" wordmark. */
export function Wordmark({
  size = 30,
  bg = LOGO_GREEN,
  textColor = "var(--color-bk-ink)",
  className,
}: WordmarkProps) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: size * 0.37 }}>
      <LogoMark size={size} bg={bg} />
      <span
        style={{
          fontFamily: "var(--font-ui), system-ui, sans-serif",
          fontSize: size * 0.63,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: textColor,
        }}
      >
        Bulga
      </span>
    </div>
  );
}
