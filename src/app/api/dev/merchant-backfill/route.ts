import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { warmMerchantDomains } from "@/lib/merchant/resolve";

// Admin-only, idempotent backfill for the shared merchant-logo cache.
//
// Read-time transaction logos come from the cross-user Merchant cache
// (dictionary + previously-resolved merchants). Going forward, Plaid sync and
// statement import warm that cache automatically — but merchants that only exist
// in already-imported history were never resolved. This walks every distinct
// transaction merchant name and resolves the misses (Claude runs once per new
// merchant), so existing transactions light up without storing anything on the
// transaction rows themselves.
//
// Bounded per call: resolves up to `max` misses and reports how many remain.
// Hit it repeatedly (each pass shrinks the miss set) until { done: true }.
//   GET /api/dev/merchant-backfill?max=50
export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!me?.isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const max = Math.min(Number(new URL(request.url).searchParams.get("max")) || 50, 200);

  // Distinct merchant names across ALL users — the cache is cross-user, so one
  // warm benefits everyone and de-dupes shared merchants automatically.
  const rows = await prisma.transaction.findMany({
    distinct: ["name"],
    select: { name: true },
    orderBy: { name: "asc" },
  });
  const names = rows.map((r) => r.name);

  const { resolved, remaining } = await warmMerchantDomains(names, { max });

  return Response.json({
    distinctMerchants: names.length,
    resolvedThisPass: resolved,
    remaining,
    done: remaining === 0,
  });
}
