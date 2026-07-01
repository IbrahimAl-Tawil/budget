// Minimal structured security-event logger. Emits a stable-prefixed line so a
// platform log drain (or the Sentry/OTel hook in instrumentation.ts) can alert on
// it. NEVER pass secrets, tokens, raw errors, or PII here — only safe scalars.

export type SecurityEvent =
  | "auth.callback_failed"
  | "authz.denied"
  | "ratelimit.exceeded"
  | "webhook.signature_failed"
  | "account.deleted"
  | "plaid.unlinked";

export function logSecurityEvent(
  event: SecurityEvent,
  fields: Record<string, string | number | boolean | undefined> = {},
): void {
  console.warn(
    `[security] ${event}`,
    JSON.stringify({ event, ts: new Date().toISOString(), ...fields }),
  );
}
