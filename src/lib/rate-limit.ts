// In-memory sliding-window rate limiter. Suitable for this app's single Node
// process (SQLite-backed). Counters reset on restart, which is fine for
// throttling; money-critical link limits are ALSO enforced durably in the DB
// (see lib/plaid/guards.ts). Server-only.

import { logSecurityEvent } from "@/lib/log";

type Rule = { limit: number; windowMs: number };

const buckets = new Map<string, number[]>();

export interface RateResult {
  ok: boolean;
  /** Seconds to wait before retrying (0 when allowed). */
  retryAfterSec: number;
}

/**
 * Allow an event under `key` if it satisfies every rule. Peeks all rules first;
 * only records a hit (in each window) when all pass, so a rejection doesn't
 * consume quota. Pass a stable key like `plaid:sync:<userId>`.
 */
export function rateLimit(key: string, rules: Rule[]): RateResult {
  const now = Date.now();

  // Peek — find the first exceeded window.
  for (const r of rules) {
    const subKey = `${key}#${r.windowMs}`;
    const hits = (buckets.get(subKey) ?? []).filter((t) => t > now - r.windowMs);
    if (hits.length === 0) buckets.delete(subKey);
    else buckets.set(subKey, hits);
    if (hits.length >= r.limit) {
      const retryAfterSec = Math.max(1, Math.ceil((hits[0] + r.windowMs - now) / 1000));
      logSecurityEvent("ratelimit.exceeded", { key, windowMs: r.windowMs });
      return { ok: false, retryAfterSec };
    }
  }

  // All windows have room — record the hit.
  for (const r of rules) {
    const subKey = `${key}#${r.windowMs}`;
    const hits = buckets.get(subKey) ?? [];
    hits.push(now);
    buckets.set(subKey, hits);
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Standard 429 response with a Retry-After header. */
export function tooManyRequests(retryAfterSec: number, message = "Too many requests. Please slow down.") {
  return Response.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
