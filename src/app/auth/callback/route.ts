import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/log";

// Supabase auth callback: exchanges the ?code from an email-confirmation or OAuth
// redirect for a session, writing the auth cookies, then forwards the user on.
// This is the one auth route that must stay REST (Supabase drives the redirect).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow a same-origin, single-slash local path. Rejects open-redirect
  // payloads like "//evil.com", "/\evil.com", "@evil.com", "https://evil.com".
  const rawNext = searchParams.get("next") ?? "/onboarding";
  const next = /^\/[^/\\]/.test(rawNext) ? rawNext : "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  logSecurityEvent("auth.callback_failed", { hadCode: !!code });
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
