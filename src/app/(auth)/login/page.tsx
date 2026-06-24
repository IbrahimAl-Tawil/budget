"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Input } from "@/components/ui/input";
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
      <div className="text-center mb-8">
        <a href="/" className="font-serif text-3xl tracking-[-0.02em] text-bulga-text">
          Bulg<em className="not-italic text-sage">a</em>
        </a>
        <p className="text-neutral-900 text-sm mt-2">Sign in to your budget dashboard</p>
      </div>

      <GlassCard className="hover:translate-y-0">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-neutral-400 mb-1.5">
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
            <label htmlFor="password" className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-neutral-400 mb-1.5">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
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
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-400 mt-5">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-sage font-semibold hover:underline">
            Sign up
          </a>
        </p>
      </GlassCard>
    </>
  );
}
