import { handleRequest } from "@/lib/graphql/yoga";

// Prisma + the Plaid/AI SDKs need Node, not the Edge runtime; and the endpoint is
// per-request (auth from cookies), so it must never be statically optimized.
//
// CSRF: the plugin (see yoga.ts) only enforces `x-graphql-csrf` on non-preflighted
// content types (form-urlencoded/multipart/text). A JSON POST is exempt — it's
// preflight-protected and blocked cross-origin by cors:false — so the Plaid sync
// cron works over application/json with just its secret:
//   POST /api/graphql   Content-Type: application/json   x-cron-secret: $CRON_SECRET
//   body: {"query":"mutation{ syncPlaid }"}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Wrap Yoga's handleRequest so the exported handlers match Next 16's route
// signature. Yoga builds its context (including `request`) from the first arg;
// the empty server-context object is all it needs as the second.
export function GET(request: Request) {
  return handleRequest(request, {});
}

export function POST(request: Request) {
  return handleRequest(request, {});
}

export function OPTIONS(request: Request) {
  return handleRequest(request, {});
}
