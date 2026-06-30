// Bulga brand mark.
//
// A bold, filled "B" monogram with knockout (negative-space) counters and a
// fine cut splitting the two bowls — a stylized, ownable letterform rather than
// a generic glyph. Sits in the brand's rounded-square lockup, reads cleanly
// from a 44px tile down to a 16px favicon. Monochrome-safe.

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
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill={fg}
        aria-hidden="true"
      >
        {/* bold filled B with knockout counters + a fine cut between the bowls */}
        <path
          fillRule="evenodd"
          d="M5 3h8.2a4.4 4.4 0 0 1 2.9 7.7A4.6 4.6 0 0 1 14 21H5V3Zm3.2 3v4h4.6a2 2 0 1 0 0-4H8.2Zm0 6.6v5.4H14a2.5 2.5 0 0 0 0-5H8.2v-.4Z"
        />
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
