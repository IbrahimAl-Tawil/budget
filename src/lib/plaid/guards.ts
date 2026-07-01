// Durable, money-critical limits on bank linking. Each linked Plaid Item is a
// billable monthly subscription, so we cap both the number of concurrent links
// and the rate of new links (which survives disconnects via PlaidLinkEvent —
// otherwise connect/disconnect churn would be invisible). Server-only.

import { prisma } from "@/lib/db/prisma";
import { HOUR } from "@/lib/rate-limit";

// Tunable via env; sensible defaults for a personal budgeting app.
export const MAX_LINKED_ITEMS = Number(process.env.PLAID_MAX_LINKED_ITEMS || 20);
export const MAX_LINKS_PER_HOUR = Number(process.env.PLAID_MAX_LINKS_PER_HOUR || 5);
export const MAX_LINKS_PER_DAY = Number(process.env.PLAID_MAX_LINKS_PER_DAY || 15);

export interface QuotaResult {
  ok: boolean;
  reason?: string;
}

/**
 * Gate a new bank connection for a user. Checks the concurrent-item cap and the
 * rolling link-rate (per hour + per day). Call before creating a link token and
 * again before exchanging the public token (the source of truth).
 */
export async function checkLinkQuota(userId: string): Promise<QuotaResult> {
  const now = Date.now();
  const [itemCount, hourCount, dayCount] = await Promise.all([
    prisma.plaidItem.count({ where: { userId } }),
    prisma.plaidLinkEvent.count({
      where: { userId, createdAt: { gt: new Date(now - HOUR) } },
    }),
    prisma.plaidLinkEvent.count({
      where: { userId, createdAt: { gt: new Date(now - 24 * HOUR) } },
    }),
  ]);

  if (itemCount >= MAX_LINKED_ITEMS) {
    return { ok: false, reason: `You've reached the maximum of ${MAX_LINKED_ITEMS} linked banks. Disconnect one to add another.` };
  }
  if (hourCount >= MAX_LINKS_PER_HOUR) {
    return { ok: false, reason: "Too many bank connections in the last hour. Please try again later." };
  }
  if (dayCount >= MAX_LINKS_PER_DAY) {
    return { ok: false, reason: "You've hit today's bank-connection limit. Please try again tomorrow." };
  }
  return { ok: true };
}

/** Record a successful link and prune events older than the rolling window. */
export async function recordLinkEvent(userId: string): Promise<void> {
  await prisma.plaidLinkEvent.create({ data: { userId } });
  // Best-effort cleanup so the log stays small.
  await prisma.plaidLinkEvent
    .deleteMany({ where: { userId, createdAt: { lt: new Date(Date.now() - 2 * 24 * HOUR) } } })
    .catch(() => {});
}
