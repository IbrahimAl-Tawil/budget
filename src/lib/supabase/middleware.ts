import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Refreshes the Supabase auth session on every request and surfaces the current
 * user for the proxy's redirect logic. Returns the response carrying refreshed
 * auth cookies — the caller must return this response (or copy its cookies onto
 * any redirect it issues) or the session won't persist.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // Pin cookie attributes (Secure in prod, SameSite=Lax) — @supabase/ssr
      // never sets Secure on its own.
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: getUser() validates the JWT with Supabase — do not replace with getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
