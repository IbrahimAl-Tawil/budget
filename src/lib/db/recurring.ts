// Recurring-subscription detection + persistence (server-only).
//
// One code path turns "recurring expenses" into `Subscription` rows, shared by
// every entry point: the automatic pass that runs after a bank link or a
// statement import, and the manual toggle on a single transaction. The AI
// primitive (detectRecurringExpenses) only surfaces candidates; the sign
// convention, dedup, confidence gating, and cadence mapping all live here so
// the three callers stay consistent.

import { prisma } from "./prisma";
import { detectRecurringExpenses } from "@/lib/ai/detect-recurring";
import { resolveMerchant } from "@/lib/merchant/resolve";
import { SUBSCRIPTION_CYCLES } from "@/lib/constants";

// At or above this confidence we add the subscription outright (status
// "active"); anything the detector is less sure of is filed as "suggested" for
// the user to accept or decline in the review queue rather than dropped.
const AUTO_ADD_CONFIDENCE = 0.85;

// Mirror the per-user cap enforced by createSubscription so an over-eager
// detection pass can't balloon a user's list.
const MAX_SUBSCRIPTIONS = 200;

/** Normalized key for name-based dedup (trim + lowercase). */
const nameKey = (s: string) => s.trim().toLowerCase();

/** Map the detector's finer-grained cadence onto the two cycles the product
 *  supports. Annual stays annual; weekly/monthly/quarterly all read as Monthly
 *  (the user can retune it in the Recurring section). */
function toCycle(frequency: string | undefined): (typeof SUBSCRIPTION_CYCLES)[number] {
  return frequency === "Annual" ? "Annual" : "Monthly";
}

/**
 * Detect recurring expenses from the user's recent history and persist any that
 * aren't already tracked. High-confidence matches land as active subscriptions;
 * the rest go to the review queue. Best-effort and side-effect-only — callers
 * (link / import) should not fail if this throws.
 *
 * @returns counts of newly added (active) and suggested (review-queue) rows.
 */
export async function detectAndStoreRecurring(
  userId: string,
): Promise<{ added: number; suggested: number }> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: sixMonthsAgo }, amount: { lt: 0 } },
    orderBy: { date: "asc" },
    select: { id: true, name: true, amount: true, date: true, categoryId: true },
  });
  if (transactions.length < 5) return { added: 0, suggested: 0 };

  const suggestions = await detectRecurringExpenses(
    transactions.map((tx) => ({
      id: tx.id,
      name: tx.name,
      amount: tx.amount,
      date: tx.date.toISOString().split("T")[0],
    })),
  );
  if (suggestions.length === 0) return { added: 0, suggested: 0 };

  // Dedup against EVERY subscription the user already has — active, already
  // suggested, or previously dismissed — so we never duplicate a tracked
  // service nor re-surface one they've explicitly declined.
  const existing = await prisma.subscription.findMany({
    where: { userId },
    select: { name: true },
  });
  const seen = new Set(existing.map((s) => nameKey(s.name)));
  // So a detected sub inherits the budget category of the transactions behind
  // it (drives the per-category "committed" figure).
  const categoryByTx = new Map(transactions.map((t) => [t.id, t.categoryId]));

  let headroom = MAX_SUBSCRIPTIONS - existing.length;
  let added = 0;
  let suggested = 0;

  for (const s of suggestions) {
    if (headroom <= 0) break;
    const name = (s.merchantName ?? "").trim();
    if (!name) continue;
    const key = nameKey(name);
    if (seen.has(key)) continue;

    const amount = Math.abs(Number(s.amount) || 0);
    if (amount <= 0) continue;

    seen.add(key);
    headroom--;

    const isAuto = (Number(s.confidence) || 0) >= AUTO_ADD_CONFIDENCE;
    const categoryId =
      (s.transactionIds ?? [])
        .map((id) => categoryByTx.get(id))
        .find((c): c is string => Boolean(c)) ?? undefined;

    // A failed logo lookup must not abort the whole pass — degrade to no logo.
    const merchant = await resolveMerchant(name).catch(() => ({ domain: null }));

    await prisma.subscription.create({
      data: {
        userId,
        name,
        amount,
        cycle: toCycle(s.frequency),
        categoryId,
        domain: merchant.domain,
        status: isAuto ? "active" : "suggested",
        isActive: isAuto,
        // Auto-detected, not hand-confirmed — even the high-confidence ones were
        // added on the user's behalf, so leave confirmedByUser false until they
        // touch it.
        confirmedByUser: false,
        lastTransactionDate: new Date(),
      },
    });

    if (isAuto) added++;
    else suggested++;
  }

  return { added, suggested };
}

/**
 * Reflect the "recurring subscription" toggle on a single transaction.
 *
 * Checking it promotes an existing suggestion or creates a fresh active,
 * user-confirmed subscription (deduped by name). Unchecking dismisses the
 * matching active subscription (kept as "dismissed", not deleted, so detection
 * won't re-suggest it).
 */
export async function setSubscriptionForTransaction(
  userId: string,
  fields: { name: string; amount: number; cycle: string; categoryId?: string | null },
  active: boolean,
): Promise<void> {
  const name = fields.name.trim();
  if (!name) return;
  const cycle = toCycle(fields.cycle);
  const amount = Math.abs(fields.amount);

  const existing = await prisma.subscription.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" } },
  });

  if (active) {
    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: "active",
          isActive: true,
          confirmedByUser: true,
          amount: amount > 0 ? amount : existing.amount,
          cycle,
          categoryId: fields.categoryId ?? existing.categoryId,
          lastTransactionDate: new Date(),
        },
      });
      return;
    }
    if ((await prisma.subscription.count({ where: { userId } })) >= MAX_SUBSCRIPTIONS) return;
    const merchant = await resolveMerchant(name).catch(() => ({ domain: null }));
    await prisma.subscription.create({
      data: {
        userId,
        name,
        amount,
        cycle,
        categoryId: fields.categoryId ?? undefined,
        domain: merchant.domain,
        status: "active",
        isActive: true,
        confirmedByUser: true,
        lastTransactionDate: new Date(),
      },
    });
    return;
  }

  // Unchecking — retire the tracked subscription if we have one.
  if (existing && existing.status === "active") {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: "dismissed", isActive: false },
    });
  }
}
