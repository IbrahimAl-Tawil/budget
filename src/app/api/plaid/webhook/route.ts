import { prisma } from "@/lib/db/prisma";
import { verifyPlaidWebhook } from "@/lib/plaid/webhook-verify";
import { syncItem, safePlaidErr } from "@/lib/plaid/sync";
import { rateLimit, tooManyRequests, SECOND, MINUTE } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 64 * 1024;

/**
 * Read the body with a hard byte cap, enforced on the actual bytes (not the
 * spoofable Content-Length header — a chunked request can omit it). Returns null
 * if the cap is exceeded.
 */
async function readBodyCapped(request: Request, maxBytes: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

// Public endpoint (no getApiUser) — Plaid calls it. All /api/* bypass the proxy,
// so this needs no proxy change; authenticity comes from the signed JWT header.
export async function POST(request: Request) {
  // Coarse global cap BEFORE any verification work. Legit Plaid volume is low;
  // this stops an attacker from forging headers to force verification-key
  // fetches to Plaid. Dropped webhooks are recovered by the daily cron.
  const flood = rateLimit("plaid:webhook:global", [{ limit: 120, windowMs: MINUTE }]);
  if (!flood.ok) return tooManyRequests(flood.retryAfterSec);

  // Legit Plaid webhook bodies are a few KB; cap the actual bytes read so a
  // hostile client can't exhaust memory (Content-Length can be omitted).
  const body = await readBodyCapped(request, MAX_WEBHOOK_BYTES);
  if (body === null) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }
  const signature = request.headers.get("plaid-verification");

  if (!(await verifyPlaidWebhook(body, signature))) {
    logSecurityEvent("webhook.signature_failed");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    webhook_type?: string;
    webhook_code?: string;
    item_id?: string;
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Bad payload" }, { status: 400 });
  }

  const { webhook_type, webhook_code, item_id } = payload;
  if (!item_id) return Response.json({ received: true });

  const item = await prisma.plaidItem.findUnique({ where: { itemId: item_id } });
  if (!item) return Response.json({ received: true });

  try {
    if (
      webhook_type === "TRANSACTIONS" ||
      // Holdings / investment-transaction updates also drive a full sync —
      // syncItem itemizes holdings alongside transactions in one pass.
      webhook_type === "HOLDINGS" ||
      webhook_type === "INVESTMENTS_TRANSACTIONS"
    ) {
      // SYNC_UPDATES_AVAILABLE / DEFAULT_UPDATE / INITIAL_UPDATE / HISTORICAL_UPDATE.
      // Debounce per Item so a burst of webhooks can't hammer the Plaid API; a
      // skipped sync is harmless (the cursor catches up on the next one).
      const gate = rateLimit(`plaid:webhook-sync:${item.itemId}`, [{ limit: 3, windowMs: 10 * SECOND }]);
      if (gate.ok) await syncItem(item);
    } else if (
      webhook_type === "ITEM" &&
      (webhook_code === "ERROR" || webhook_code === "PENDING_EXPIRATION")
    ) {
      await prisma.plaidItem.update({
        where: { id: item.id },
        data: { status: "login_required" },
      });
    }
  } catch (err) {
    console.error("plaid webhook processing error:", safePlaidErr(err));
  }

  return Response.json({ received: true });
}
