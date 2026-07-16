// Blog index (the /blog landing). Server component. A calm editorial grid on the
// warm canvas: Newsreader hero, one accent, otterfund card surfaces. The first
// (newest) post gets a wider featured card; the rest flow into a two-up grid.

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/otterfund/logo";
import { Wordmark } from "@/components/otterfund/wordmark";
import { renderText } from "@/components/blog/render-text";
import { type BlogPost, formatPostDate } from "@/lib/blog";
import { LEGAL } from "@/lib/legal";

const SERIF: React.CSSProperties = { fontFamily: "var(--font-num), Georgia, serif" };

function Meta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--color-of-faint)]">
      <span className="text-[var(--color-accent-foreground)]">{post.category}</span>
      <span aria-hidden>·</span>
      <span>{formatPostDate(post.publishedAt)}</span>
      <span aria-hidden>·</span>
      <span>{post.readMinutes} min</span>
    </div>
  );
}

export function BlogIndexView({ posts }: { posts: BlogPost[] }) {
  const [featured, ...rest] = posts;

  return (
    <div className="of-paper min-h-screen bg-[var(--color-of-canvas)] text-[var(--color-of-ink)]">
      {/* top chrome */}
      <header className="border-b border-[var(--color-of-line-soft)]">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-4">
          <Link href="/" aria-label="otterfund home" className="inline-flex items-center">
            <LogoMark size={44} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 pb-24 pt-12 sm:pt-16">
        {/* hero */}
        <div className="of-enter max-w-[640px]">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-of-faint)]">
            The <Wordmark /> blog
          </div>
          <h1
            className="mt-3 text-[clamp(32px,5.5vw,48px)] leading-[1.05] tracking-[-0.02em] text-[var(--color-of-ink)]"
            style={{ ...SERIF, fontWeight: 500 }}
          >
            Money, made calm.
          </h1>
          <p className="mt-4 text-[16px] leading-[1.6] text-[var(--color-of-muted)]">
            Plain-language guides to the 50/30/20 rule, allocating your paycheck, and
            honest comparisons of the best budgeting apps in 2026. No jargon, no
            guilt, no spreadsheets.
          </p>
        </div>

        {/* featured (newest) post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="of-enter group mt-10 block overflow-hidden rounded-[22px] border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-7 transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_oklch(20%_0.02_80/0.1)] sm:p-9"
          >
            <Meta post={featured} />
            <h2
              className="mt-3 max-w-[22ch] text-[clamp(24px,3.5vw,32px)] leading-[1.15] tracking-[-0.015em] text-[var(--color-of-ink)]"
              style={{ ...SERIF, fontWeight: 500 }}
            >
              {renderText(featured.title, "feat-title")}
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15.5px] leading-[1.65] text-[var(--color-of-muted)]">
              {renderText(featured.excerpt, "feat-excerpt")}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--color-accent-foreground)]">
              Read the guide
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </span>
          </Link>
        )}

        {/* the rest */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="of-enter group flex flex-col rounded-[20px] border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_oklch(20%_0.02_80/0.08)]"
            >
              <Meta post={post} />
              <h2 className="mt-2.5 text-[18px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--color-of-ink)]">
                {renderText(post.title, `title-${post.slug}`)}
              </h2>
              <p className="mt-2 flex-1 text-[14px] leading-[1.6] text-[var(--color-of-muted)]">
                {renderText(post.excerpt, `excerpt-${post.slug}`)}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-accent-foreground)]">
                Read
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
              </span>
            </Link>
          ))}
        </div>

        {/* footer */}
        <footer className="mt-20 flex flex-col gap-4 border-t border-[var(--color-of-line-soft)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-of-muted)]">
            <LogoMark size={16} />
            <Wordmark />
          </div>
          <nav className="flex items-center gap-5 text-[13px]" aria-label="Footer">
            <Link href="/pricing" className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]">
              Pricing
            </Link>
            <Link href="/privacy" className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]">
              Privacy
            </Link>
            <a
              href={`mailto:${LEGAL.supportEmail}`}
              className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]"
            >
              Contact
            </a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
