import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { generateInsightsForUser } from "@/lib/ai/generate-insights";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Rate limit: one generation per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentInsight = await prisma.insight.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    });

    if (recentInsight) {
      // Return existing insights from today
      const insights = await prisma.insight.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: today },
        },
        orderBy: { createdAt: "desc" },
      });

      return Response.json({
        insights: insights.map((i) => ({
          id: i.id,
          tag: i.tag,
          body: i.body,
          tagColor: i.tagColor || "oklch(60% 0.09 155)",
          tagBg: i.tagBg || "oklch(25% 0.06 155)",
        })),
        cached: true,
      });
    }

    const insights = await generateInsightsForUser(user.id);

    return Response.json({ insights, cached: false });
  } catch (error) {
    console.error("Insights generation error:", error);
    return Response.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
