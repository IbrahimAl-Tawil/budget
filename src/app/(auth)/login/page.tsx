"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Card } from "@/components/bulga/card";
import { Wordmark } from "@/components/bulga/logo";
import { Field, TextInput, PasswordInput } from "@/components/bulga/form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If next-auth redirected here with ?error=..., surface it inline.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError("Incorrect email or password. Please try again.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" aria-label="Bulga home">
          <Wordmark size={34} />
        </Link>
        <p className="text-[13px] text-[var(--color-bk-muted)]">
          Sign in to your budget dashboard
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Email" htmlFor="email">
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          {error && (
            <p className="text-sm font-medium text-[var(--color-bk-clay)]">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full text-sm font-semibold"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-bk-muted)] mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </Card>
    </>
  );
}
