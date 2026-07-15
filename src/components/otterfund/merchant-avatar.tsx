"use client";

// Merchant avatar tile: shows the company logo (Google favicon keyed on the
// merchant's domain) and falls back to a themed letter tile when there's no
// domain or the image fails to load. Never renders a broken image.

import { useEffect, useState } from "react";
import { logoCandidates } from "@/lib/merchant/logo";

interface MerchantAvatarProps {
  name: string;
  domain?: string | null;
  /** Fallback tile background (theme-derived tint). */
  bg: string;
  /** Fallback letter colour. */
  ink: string;
  size?: number;
  /**
   * How the logo sits in the tile. "cover" fills edge-to-edge (default — good
   * for full-bleed favicons); "contain" shows the whole logo centred with a
   * little breathing room (better for boxy brand marks like bank icons that
   * would otherwise get cropped off-centre).
   */
  fit?: "cover" | "contain";
}

export function MerchantAvatar({ name, domain, bg, ink, size = 38, fit = "cover" }: MerchantAvatarProps) {
  const contain = fit === "contain";
  // Candidate logo URLs, best source first (logo.dev hi-res → Google favicon).
  // We walk the list on each <img> error, falling through to the letter tile
  // once exhausted — so a logo.dev miss quietly degrades to a favicon.
  const candidates = logoCandidates(domain, size);
  const [idx, setIdx] = useState(0);
  // Reset to the best source whenever the domain changes (e.g. as a form field
  // is typed) so a new bank re-tries the primary provider, not a fallback.
  useEffect(() => setIdx(0), [domain]);
  const src = candidates[idx] ?? null;
  const showLogo = !!src;

  // The logo fills the whole tile edge-to-edge (no padding, object-fit:cover)
  // unless `fit="contain"`, which centres the full mark with a small inset. The
  // letter fallback keeps the themed tint background.
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: showLogo ? "#fff" : bg,
        color: ink,
        fontSize: Math.round(size * 0.4),
        fontWeight: 700,
        padding: showLogo && contain ? Math.round(size * 0.15) : 0,
      }}
    >
      {showLogo ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: contain ? "contain" : "cover",
            display: "block",
          }}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}
