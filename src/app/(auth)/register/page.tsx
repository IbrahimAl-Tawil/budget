"use client";

import { useState } from "react";
import { GlassCard } from "@/components/dashboard/primitives/glass-card";
import { Input } from "@/components/ui/input";
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
      <div className="text-center">
        <a href="/" className="font-serif text-[clamp(2.5rem,8vw,3.25rem)] tracking-[-0.035em] leading-[0.92] text-bulga-text">
          Bulg<em className="not-italic text-sage">a</em>
        </a>
        <p className="text-[13px] mt-3 text-muted-text">Create your account to get started</p>
      </div>

      <GlassCard className="p-8 sm:p-10 hover:translate-y-0">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="h-10 rounded-xl bg-neutral-50 border-black/[0.06]"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-10 rounded-xl bg-neutral-50 border-black/[0.06]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="h-10 rounded-xl bg-neutral-50 border-black/[0.06]"
            />
          </div>

          {error && (
            <p className="text-sm text-terra font-medium">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-bulga-text text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-text mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-sage font-semibold hover:underline">
            Sign in
          </a>
        </p>
      </GlassCard>
    </>
  );
}
