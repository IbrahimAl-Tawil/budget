"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, TextInput, PasswordInput } from "@/components/otterfund/form";
import { Button } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/auth/google-button";
import { useTurnstile } from "@/components/auth/use-turnstile";
import { Wordmark } from "@/components/otterfund/wordmark";

// useSearchParams() must sit under a Suspense boundary or `next build` errors on
// this route. The form is otherwise self-contained, so wrap the whole thing.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // If redirected here with ?error=..., surface it inline. useSearchParams reads
  // the URL during render (SSR-safe) — no effect + window.location needed.
  const hadRedirectError = useSearchParams().has("error");
  const [error, setError] = useState(
    hadRedirectError ? "Incorrect email or password. Please try again." : "",
  );
  const [loading, setLoading] = useState(false);
  // Turnstile bot check — the token rides along on the sign-in call, which
  // Supabase verifies server-side. Inert unless a site key is configured.
  const captcha = useTurnstile();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captcha.captchaToken },
    });

    if (signInError) {
      setError("Incorrect email or password. Please try again.");
      captcha.reset(); // the token is single-use — re-arm for another try
      setLoading(false);
      return;
    }

    // Full navigation so the proxy sees the fresh session cookie and routes to
    // dashboard or onboarding as appropriate.
    window.location.href = "/dashboard";
  }

  return (
    <div className="of-enter">
      <header className="mb-8">
        <h1 className="text-[27px] font-semibold tracking-[-0.02em] text-[var(--color-of-ink)]">
          Welcome back
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-of-muted)]">
          Sign in to pick up where you left off.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Email" htmlFor="email">
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            required
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <div className="mt-2 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]"
            >
              Forgot password?
            </Link>
          </div>
        </Field>

        {error && (
          <p className="text-sm font-medium text-[var(--color-of-clay)]">{error}</p>
        )}

        {captcha.widget}

        <Button
          type="submit"
          disabled={loading || captcha.pending}
          className="w-full font-semibold"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <GoogleAuthButton label="Continue with Google" />

      {/* Passive Terms + Privacy notice. Sign-in has no consent gate (the
          account already exists), so this states acceptance rather than
          requiring a checkbox like registration does. */}
      <p className="mt-6 text-center text-[13px] leading-relaxed text-[var(--color-of-muted)]">
        By signing in, you agree to <Wordmark />&rsquo;s{" "}
        <Link
          href="/terms"
          target="_blank"
          className="font-medium text-[var(--color-primary)] hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="font-medium text-[var(--color-primary)] hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-8 text-center text-sm text-[var(--color-of-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[var(--color-primary)] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
