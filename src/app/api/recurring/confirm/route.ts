import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { transactionIds, action, merchantName, amount, frequency } = body as {
      transactionIds: string[];
      action: "confirm" | "reject";
      merchantName?: string;
      amount?: number;
      frequency?: string;
    };

    // Update transaction recurring flags
    await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
      data: {
        isRecurring: action === "confirm",
        recurringFlag: action === "confirm" ? "confirmed" : "rejected",
      },
    });

    // If confirming, create a subscription record
    if (action === "confirm" && merchantName && amount) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          name: merchantName,
          amount: Math.abs(amount),
          cycle: frequency || "Monthly",
          confirmedByUser: true,
        },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Recurring confirm error:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}
