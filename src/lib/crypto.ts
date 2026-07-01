// AES-256-GCM encryption for secrets at rest (Plaid access tokens).
// Server-only. Uses ENCRYPTION_KEY (64 hex chars = 32 bytes).

import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY is not set");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }
  return key;
}

// Key-version tag on the payload so ENCRYPTION_KEY can be rotated later (select a
// key by version, decrypt old ciphertext with the previous key during rollover).
const KEY_VERSION = "v1";

/** Encrypt to `v1:iv:authTag:ciphertext` (all hex). */
export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${KEY_VERSION}:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/** Reverse of {@link encryptToken}. Throws if the payload is malformed or tampered. */
export function decryptToken(payload: string): string {
  const parts = payload.split(":");
  // Accept both the versioned form (v1:iv:tag:data) and the legacy 3-part form.
  const [ivHex, tagHex, dataHex] = parts.length === 4 ? parts.slice(1) : parts;
  if (!ivHex || !tagHex || !dataHex) throw new Error("Malformed encrypted token");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
