import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "20");
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  const where: Record<string, unknown> = { userId: user.id };

  if (search) {
    where.name = { contains: search };
  }

  if (category) {
    where.category = { name: category };
  }

  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);
    where.date = { gte: startDate, lt: endDate };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return Response.json({
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, amount, category, type, accountId, date } = body;

    if (!name || amount === undefined) {
      return Response.json(
        { error: "Name and amount are required" },
        { status: 400 }
      );
    }

    const finalAmount = type === "credit" ? Math.abs(amount) : -Math.abs(amount);

    // Find or handle category
    let categoryId: string | undefined;
    if (category) {
      const cat = await prisma.category.findUnique({
        where: { userId_name: { userId: user.id, name: category } },
      });
      categoryId = cat?.id;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        name,
        amount: finalAmount,
        date: date ? new Date(date) : new Date(),
        categoryId,
        accountId: accountId || undefined,
        source: "manual",
      },
      include: { category: true },
    });

    return Response.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
