// Logo URLs for a merchant/institution domain. Single source of truth for the
// logo providers so they can be swapped in one place (client-safe — no server
// imports).
//
// We key on DOMAIN, not company name — the hard part (name → domain) is done by
// the merchant resolver. Providers, tried in order:
//   1. logo.dev — curated, high-resolution brand logos. ONLY used when a
//      publishable token is set (NEXT_PUBLIC_LOGO_DEV_TOKEN); without it we skip
//      straight to the favicon. This is the only way to get a crisp logo for a
//      site that publishes only a tiny favicon (most banks). Free tier + a
//      publishable (client-safe) key: https://logo.dev
//   2. Google favicon service — near-universal but low-res (often 32px, since
//      that's all the site publishes); the reliable fallback so we almost always
//      show *something* before the letter tile.
// Allow-listed hosts live in next.config's img-src CSP.
//
// NOTE: Clearbit's free logo API (logo.clearbit.com) was shut down by HubSpot —
// it now fails to connect, so it was removed. Keyless services (favicon,
// DuckDuckGo, unavatar) all just return the site's own small favicon.

// Publishable logo.dev token (client-safe by design). Empty string when unset.
const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ?? "";

/**
 * Ordered list of logo URLs to try for a domain, best source first. The avatar
 * component walks this list on <img> error, falling through to the letter tile
 * once exhausted. `size` is the desired display size in CSS px; we request well
 * above it so the image stays crisp on high-DPI screens.
 *
 * With a logo.dev token: logo.dev (curated hi-res) first, Google favicon as the
 * backfall. Without one: favicon only. `fallback=404` is essential — logo.dev's
 * default returns a generated monogram (HTTP 200) that would never trigger our
 * onError fallback, so we force a real 404 on a miss and let the favicon catch it.
 */
export function logoCandidates(domain: string | null | undefined, size = 64): string[] {
  if (!domain) return [];
  const clean = domain.trim().toLowerCase();
  if (!clean) return [];
  const d = encodeURIComponent(clean);
  // Always request Google's ceiling (128). `sz` is a max, not a guarantee — the
  // service returns whatever the site actually publishes, capped at 128 — so 128
  // is a free sharpness win for brands with larger favicons (Netflix, Disney+)
  // and costs nothing for those that only ship 32px (most banks).
  const google = `https://www.google.com/s2/favicons?domain=${d}&sz=128`;
  if (!LOGO_DEV_TOKEN) return [google];
  // Request 3× the display size (min 128, logo.dev max 800) for a sharp downscale.
  const px = Math.min(800, Math.max(128, Math.round(size * 3)));
  const logodev = `https://img.logo.dev/${d}?token=${LOGO_DEV_TOKEN}&size=${px}&format=png&retina=true&fallback=404`;
  return [logodev, google];
}

/** First (highest-quality) logo URL for a domain, or null. Kept for callers that
 *  only need one URL; prefer logoCandidates() when a fallback chain is wanted. */
export function logoUrl(domain: string | null | undefined, size = 64): string | null {
  return logoCandidates(domain, size)[0] ?? null;
}
