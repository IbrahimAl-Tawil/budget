import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { getDashboardOverview, getSpendingData, getGoals, getTransactions, getSubscriptions, getAccounts, getInsights } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });

  if (!token?.id) {
    console.error("Dashboard auth failed — token:", token, "secret defined:", !!secret);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = token.id as string;
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "overview";
  const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const page = Number(url.searchParams.get("page")) || 1;
  const search = url.searchParams.get("search") || "";

  try {
    switch (tab) {
      case "overview":
        return Response.json(await getDashboardOverview(userId, month, year));
      case "spending":
        return Response.json(await getSpendingData(userId, month, year));
      case "goals":
        return Response.json(await getGoals(userId));
      case "transactions":
        return Response.json(await getTransactions(userId, { page, search, month, year }));
      case "subscriptions":
        return Response.json(await getSubscriptions(userId));
      case "accounts":
        return Response.json(await getAccounts(userId));
      case "insights":
        return Response.json(await getInsights(userId));
      default:
        return Response.json({ error: "Unknown tab" }, { status: 400 });
    }
  } catch (error) {
    console.error(`Dashboard ${tab} error:`, error);
    return Response.json({ error: "Failed to load data" }, { status: 500 });
  }
}
