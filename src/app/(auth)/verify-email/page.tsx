import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Card } from "@/components/bulga/card";
import { Wordmark } from "@/components/bulga/logo";

// Post-sign-up confirmation screen. When Supabase email confirmation is on,
// sign-up returns no session — we send the user here (a calm success state)
// instead of surfacing "check your email" as a clay error on the form.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" aria-label="Bulga home">
          <Wordmark size={34} />
        </Link>
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div
            className="grid place-items-center w-14 h-14 rounded-full"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            <MailCheck className="w-7 h-7" strokeWidth={1.75} />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[var(--color-bk-ink)]">
              Check your email
            </h1>
            <p className="text-sm leading-relaxed text-[var(--color-bk-muted)]">
              {email ? (
                <>
                  We sent a confirmation link to{" "}
                  <span className="font-semibold text-[var(--color-bk-ink)]">{email}</span>. Open it
                  to activate your account, then sign in.
                </>
              ) : (
                <>We sent you a confirmation link. Open it to activate your account, then sign in.</>
              )}
            </p>
          </div>

          <Link
            href="/login"
            className="w-full h-11 grid place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-semibold transition-opacity hover:opacity-90"
          >
            Back to sign in
          </Link>

          <p className="text-[13px] text-[var(--color-bk-muted)]">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--color-primary)] hover:underline"
            >
              try a different email
            </Link>
            .
          </p>
        </div>
      </Card>
    </>
  );
}
