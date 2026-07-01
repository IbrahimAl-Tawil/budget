// Next.js instrumentation. `register()` runs once at server startup — the wiring
// point for a production error monitor (add e.g. Sentry/OpenTelemetry init here).
// `onRequestError` forwards uncaught request errors; it logs only safe scalars so
// a raw error object (which can carry secrets/PII) is never emitted.

export async function register(): Promise<void> {
  // e.g. await import("@sentry/nextjs").then((s) => s.init({ dsn: process.env.SENTRY_DSN }));
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
): Promise<void> {
  console.error(
    "[request-error]",
    JSON.stringify({
      path: request?.path,
      method: request?.method,
      message: error instanceof Error ? error.message : String(error),
    }),
  );
}
