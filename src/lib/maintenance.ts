// Maintenance-mode gate — env-driven.
//
//   MAINTENANCE_MODE=true|false   locks the whole site behind a maintenance page
//   MAINTENANCE_PASSWORD=…        the admin/dev password that unlocks it
//
// Unlocking stores a cookie holding a HASH of the password (never the password
// itself). The proxy re-derives that hash on every request and compares, so the
// gate is stateless and needs no database. Uses Web Crypto only, so it runs in
// both the Edge proxy and the Node route handler.

export const MAINTENANCE_COOKIE = "of_maint";

// 7 days: long enough that a dev unlocks about once per deploy window, short
// enough that the gate re-asserts itself on its own.
export const MAINTENANCE_MAX_AGE = 60 * 60 * 24 * 7;

/** Whether the site is currently locked for maintenance. */
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

/** Whether a bypass password is configured (so we can offer the unlock form). */
export function maintenanceUnlockable(): boolean {
  return !!process.env.MAINTENANCE_PASSWORD;
}

/**
 * The opaque bypass token stored in the cookie: SHA-256 of the password, salted
 * with a fixed label so the digest is not a bare password hash. Deterministic,
 * so the proxy can recompute it and compare. Returns "" when no password is
 * configured, so an empty/absent cookie can never satisfy the gate.
 */
export async function maintenanceToken(): Promise<string> {
  const password = process.env.MAINTENANCE_PASSWORD;
  if (!password) return "";
  const data = new TextEncoder().encode(`otterfund:maintenance:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
