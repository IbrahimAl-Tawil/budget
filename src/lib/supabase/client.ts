import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for browser/client components. Used ONLY for auth
 * (signUp / signInWithPassword / signOut). All data access goes through
 * the GraphQL API, never Supabase directly.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
