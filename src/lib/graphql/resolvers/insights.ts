import { builder } from "../builder";
import { rateLimited } from "../errors";
import {
  requireEntitlement,
  requireEntitlementDetail,
  startOfMonth,
  secondsUntilNextMonth,
  nextMonthLabel,
} from "../entitlements";
import { prisma } from "@/lib/db/prisma";
import { generateInsightsForUser } from "@/lib/ai/generate-insights";
import { countInsightGenerationsSince } from "@/lib/db/ai-usage";
import { getInsightDetail } from "@/lib/db/queries";
import { rateLimit, MINUTE } from "@/lib/rate-limit";

// The real data behind one insight card, resolved from its stored focus.
builder.queryField("insightDetail", (t) =>
  t.field({
    type: "JSON",
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx) =>
      getInsightDetail(await requireEntitlement(ctx, "insights"), String(args.id)),
  }),
);

// Generate AI insights, rate-limited to one generation per calendar day and a
// per-plan monthly quota; returns the day's insights (freshly generated or
// cached). JSON return matches the shape the client already consumes from the
// old REST endpoint.
builder.mutationField("generateInsights", (t) =>
  t.field({
    type: "JSON",
    resolve: async (_root, _args, ctx) => {
      const { userId, entitlements } = await requireEntitlementDetail(ctx, "insights");
      // Blunt rapid concurrent calls (the day-guard below is the durable cap).
      const limit = rateLimit(`ai:insights:${userId}`, [
        { limit: 3, windowMs: MINUTE },
      ]);
      if (!limit.ok) rateLimited(limit.retryAfterSec);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recent = await prisma.insight.findFirst({
        where: { userId, createdAt: { gte: today } },
      });

      if (recent) {
        const insights = await prisma.insight.findMany({
          where: { userId, createdAt: { gte: today } },
          orderBy: { createdAt: "desc" },
        });
        return {
          insights: insights.map((i) => ({
            id: i.id,
            tag: i.tag,
            body: i.body,
            tagColor: i.tagColor || "oklch(60% 0.09 155)",
            tagBg: i.tagBg || "oklch(25% 0.06 155)",
            focusType: i.focusType,
            focusKey: i.focusKey,
          })),
          cached: true,
        };
      }

      // Durable monthly cap on *fresh* generations (per-plan). Cached views above
      // never consume quota — only a new generation does. A null limit means
      // unlimited (Pro). Counted from the DB so it survives restarts.
      const monthlyInsights = entitlements.insightsPerMonth;
      if (monthlyInsights != null) {
        const monthStart = startOfMonth();
        const used = await countInsightGenerationsSince(userId, monthStart);
        if (used >= monthlyInsights) {
          rateLimited(
            secondsUntilNextMonth(monthStart),
            `You've used all ${monthlyInsights} insight refreshes in your plan this month. They reset on ${nextMonthLabel(monthStart)}.`,
          );
        }
      }

      const insights = await generateInsightsForUser(userId);
      return { insights, cached: false };
    },
  }),
);
