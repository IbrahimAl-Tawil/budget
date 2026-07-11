import { prisma } from "./prisma";
import { costUsd, type TokenUsage } from "@/lib/ai/usage";

// Persistence + aggregation for AI usage tracking (chat + insights). Writes one
// AiUsageEvent per AI "job"; the /dev/usage page reads the aggregated summary.

export type AiUsageKind = "advisor" | "advisor_title" | "insights";

export interface AiUsageInput {
  userId: string;
  kind: AiUsageKind;
  model: string;
  usage: TokenUsage;
  /** Advisor turns link to their chat; null for title/insights. */
  conversationId?: string | null;
}

/**
 * Record AI usage events. BEST-EFFORT: usage tracking must never break the
 * user-facing flow, so any DB failure is logged and swallowed. Cost is derived
 * from the model + tokens and stored, so the summary is a simple sum.
 */
export async function recordAiUsage(events: AiUsageInput[]): Promise<void> {
  if (events.length === 0) return;
  try {
    await prisma.aiUsageEvent.createMany({
      data: events.map((e) => ({
        userId: e.userId,
        kind: e.kind,
        model: e.model,
        inputTokens: e.usage.inputTokens,
        outputTokens: e.usage.outputTokens,
        cacheReadInputTokens: e.usage.cacheReadInputTokens,
        cacheCreationInputTokens: e.usage.cacheCreationInputTokens,
        costUsd: costUsd(e.model, e.usage),
        conversationId: e.conversationId ?? null,
      })),
    });
  } catch (err) {
    console.error("[ai-usage] failed to record usage", err);
  }
}

/**
 * Count advisor chat turns a user has sent since `since`. Backs the durable
 * daily message cap (see the askAdvisor resolver) — one `advisor` event is
 * written per successful turn, so this counts messages the user got answers to.
 */
export async function countAdvisorTurnsSince(userId: string, since: Date): Promise<number> {
  return prisma.aiUsageEvent.count({
    where: { userId, kind: "advisor", createdAt: { gte: since } },
  });
}

/**
 * Count AI insight *generations* a user has run since `since`. One `insights`
 * event is written per successful generation (a fresh batch of cards), so this
 * backs the durable monthly insights cap (see the generateInsights resolver).
 */
export async function countInsightGenerationsSince(userId: string, since: Date): Promise<number> {
  return prisma.aiUsageEvent.count({
    where: { userId, kind: "insights", createdAt: { gte: since } },
  });
}

export interface AiUsageUserRow {
  userId: string;
  name: string | null;
  email: string | null;
  chats: number; // advisor turns sent (each chat message)
  conversations: number; // distinct chats those turns belong to
  insights: number; // insights generations
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  lastUsedAt: string | null;
}

export interface AiUsageSummary {
  users: AiUsageUserRow[];
  totals: {
    users: number;
    chats: number;
    insights: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

/**
 * Per-user usage rollup for the internal /dev/usage page, sorted by cost. Loads
 * all events and aggregates in memory — fine at internal scale (distinct-chat
 * and per-kind counts make a single groupBy awkward); revisit with grouping if
 * the table ever grows large.
 */
export async function getAiUsageSummary(): Promise<AiUsageSummary> {
  const events = await prisma.aiUsageEvent.findMany({
    select: {
      userId: true,
      kind: true,
      inputTokens: true,
      outputTokens: true,
      costUsd: true,
      conversationId: true,
      createdAt: true,
    },
  });

  type Acc = {
    chats: number;
    insights: number;
    convs: Set<string>;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    lastUsedAt: Date | null;
  };
  const byUser = new Map<string, Acc>();

  for (const e of events) {
    let row = byUser.get(e.userId);
    if (!row) {
      row = { chats: 0, insights: 0, convs: new Set(), inputTokens: 0, outputTokens: 0, costUsd: 0, lastUsedAt: null };
      byUser.set(e.userId, row);
    }
    if (e.kind === "advisor") {
      row.chats += 1;
      if (e.conversationId) row.convs.add(e.conversationId);
    } else if (e.kind === "insights") {
      row.insights += 1;
    }
    row.inputTokens += e.inputTokens;
    row.outputTokens += e.outputTokens;
    row.costUsd += e.costUsd;
    if (!row.lastUsedAt || e.createdAt > row.lastUsedAt) row.lastUsedAt = e.createdAt;
  }

  const meta = await prisma.user.findMany({
    where: { id: { in: [...byUser.keys()] } },
    select: { id: true, name: true, email: true },
  });
  const nameById = new Map(meta.map((u) => [u.id, u]));

  const users: AiUsageUserRow[] = [...byUser.entries()]
    .map(([userId, r]) => ({
      userId,
      name: nameById.get(userId)?.name ?? null,
      email: nameById.get(userId)?.email ?? null,
      chats: r.chats,
      conversations: r.convs.size,
      insights: r.insights,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      costUsd: r.costUsd,
      lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
    }))
    .sort((a, b) => b.costUsd - a.costUsd);

  const totals = users.reduce(
    (acc, r) => ({
      users: acc.users,
      chats: acc.chats + r.chats,
      insights: acc.insights + r.insights,
      inputTokens: acc.inputTokens + r.inputTokens,
      outputTokens: acc.outputTokens + r.outputTokens,
      costUsd: acc.costUsd + r.costUsd,
    }),
    { users: users.length, chats: 0, insights: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 },
  );

  return { users, totals };
}
