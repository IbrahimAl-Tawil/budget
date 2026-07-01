// Verify Plaid webhook authenticity. Server-only.
//
// Plaid signs each webhook with an ES256 JWT in the `Plaid-Verification` header.
// We (1) verify the JWT against Plaid's public key (fetched by `kid`, cached),
// then (2) confirm the SHA-256 of the raw body matches the JWT's claim.

import crypto from "node:crypto";
import * as jose from "jose";
import { plaid } from "./client";

const keyCache = new Map<string, jose.JWK>();

export async function verifyPlaidWebhook(
  body: string,
  signedJwt: string | null
): Promise<boolean> {
  if (!signedJwt) return false;
  try {
    const { alg, kid } = jose.decodeProtectedHeader(signedJwt);
    if (alg !== "ES256" || !kid) return false;

    let jwk = keyCache.get(kid);
    if (!jwk) {
      const { data } = await plaid.webhookVerificationKeyGet({ key_id: kid });
      jwk = data.key as unknown as jose.JWK;
      keyCache.set(kid, jwk);
    }

    const key = await jose.importJWK(jwk, "ES256");
    const { payload } = await jose.jwtVerify(signedJwt, key, { maxTokenAge: "5 min" });

    const claimed = (payload as { request_body_sha256?: string }).request_body_sha256;
    if (!claimed) return false;

    const actual = crypto.createHash("sha256").update(body, "utf8").digest("hex");
    const a = Buffer.from(actual);
    const b = Buffer.from(claimed);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
