import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads/writes the auth session cookies via next/headers. Used ONLY for auth
 * (getUser / signOut / admin) — never for data (that goes through Prisma/GraphQL).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // Pin cookie attributes rather than relying on @supabase/ssr defaults
      // (which never set Secure). SameSite=Lax is the CSRF backstop; Secure in
      // prod keeps the session cookie off any cleartext transport.
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component where cookies are read-only. Safe to
            // ignore — the proxy (middleware) refreshes the session on every request.
          }
        },
      },
    },
  );
}
