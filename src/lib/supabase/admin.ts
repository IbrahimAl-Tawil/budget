import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Secret-key Supabase client for privileged, server-only auth admin actions
 * (e.g. deleting an auth user when an account is removed). Uses the Supabase
 * secret API key (`sb_secret_…`, successor to the service_role key — it bypasses
 * RLS and has full access). NEVER import this into a client component — the
 * secret key must never reach the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
