// Auth no longer needs a client provider — Supabase clients are created per call
// (browser via lib/supabase/client, server via lib/supabase/server). Kept as a
// passthrough so the root layout import stays stable; add real providers here if
// the app later needs client-side context.
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
