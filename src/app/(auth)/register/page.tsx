"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/bulga/card";
import { Wordmark } from "@/components/bulga/logo";
import { Field, TextInput, PasswordInput } from "@/components/bulga/form";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Step 1: Register
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Step 2: Sign in via form POST (same way next-auth does it internally)
    const csrfRes = await fetch("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/callback/credentials";
    form.style.display = "none";

    const fields = { csrfToken, email, password, callbackUrl: "/onboarding" };
    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" aria-label="Bulga home">
          <Wordmark size={34} />
        </Link>
        <p className="text-[13px] text-[var(--color-bk-muted)]">
          Create your account to get started
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Name" htmlFor="name">
            <TextInput
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </Field>

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
              placeholder="At least 8 characters"
              required
              minLength={8}
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
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-bk-muted)] mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </>
  );
}
