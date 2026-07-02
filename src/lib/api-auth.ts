import { createClient } from "@/lib/supabase/server";

/**
 * Current authenticated user id from the Supabase session cookie, or null.
 * The `request` arg is accepted for call-site compatibility with the existing
 * REST routes but is no longer used — the session lives in cookies, read via
 * next/headers inside createClient().
 */
export async function getApiUser(
  _request?: Request,
): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id };
}
