// Blog article reading view. Server component (pure render, no interactivity) so
// the whole post ships as static HTML, which is what we want for SEO. Reuses the
// otterfund reading aesthetic: warm canvas, Newsreader display, Hanken body, one
// evergreen accent, slim chrome. The block renderer turns a BlogPost.body array
// into on-brand JSX; `renderText` swaps the `[[of]]` token (and any literal brand
// mention) for <Wordmark /> and renders **bold** inline.

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/otterfund/logo";
import { Wordmark } from "@/components/otterfund/wordmark";
import { renderText } from "@/components/blog/render-text";
import {
  type BlogBlock,
  type BlogPost,
  formatPostDate,
  getRelatedPosts,
} from "@/lib/blog";
import { LEGAL } from "@/lib/legal";

const SERIF: React.CSSProperties = { fontFamily: "var(--font-num), Georgia, serif" };

function Block({ block, index }: { block: BlogBlock; index: number }) {
  const k = `b${index}`;
  switch (block.type) {
    case "h2":
      return (
        <h2
          className="mt-12 mb-3 text-[24px] leading-[1.2] tracking-[-0.01em] text-[var(--color-of-ink)]"
          style={{ ...SERIF, fontWeight: 500 }}
        >
          {renderText(block.text, k)}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-7 mb-2 text-[16px] font-semibold text-[var(--color-of-ink)]">
          {renderText(block.text, k)}
        </h3>
      );
    case "p":
      return (
        <p className="mt-4 text-[15.5px] leading-[1.75] text-[var(--color-of-muted)]">
          {renderText(block.text, k)}
        </p>
      );
    case "ul":
      return (
        <ul className="mt-4 space-y-2 pl-1">
          {block.items.map((item, i) => (
            <li key={`${k}-${i}`} className="flex gap-3 text-[15.5px] leading-[1.7] text-[var(--color-of-muted)]">
              <span aria-hidden className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
              <span>{renderText(item, `${k}-${i}`)}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-4 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={`${k}-${i}`} className="flex gap-3 text-[15.5px] leading-[1.7] text-[var(--color-of-muted)]">
              <span
                aria-hidden
                className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[12px] font-semibold text-[var(--color-accent-foreground)] of-num"
              >
                {i + 1}
              </span>
              <span>{renderText(item, `${k}-${i}`)}</span>
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div className="mt-8 rounded-[18px] border border-[var(--color-of-line)] bg-[var(--color-accent)] p-5 sm:p-6">
          <div className="text-[12px] font-semibold uppercase tracking-[0.09em] text-[var(--color-accent-foreground)]">
            {block.title}
          </div>
          <p className="mt-2 text-[15.5px] leading-[1.7] text-[var(--color-of-ink)]">
            {renderText(block.text, k)}
          </p>
        </div>
      );
    case "table":
      return (
        <figure className="mt-8">
          <div className="of-scroll overflow-x-auto rounded-[16px] border border-[var(--color-of-line)]">
            <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="bg-[var(--color-of-field)]">
                  {block.head.map((h, i) => (
                    <th
                      key={`${k}-h-${i}`}
                      className="border-b border-[var(--color-of-line)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-of-faint)]"
                    >
                      {renderText(h, `${k}-h-${i}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={`${k}-r-${ri}`} className="border-b border-[var(--color-of-line-soft)] last:border-0">
                    {row.map((cell, ci) => (
                      <td
                        key={`${k}-r-${ri}-${ci}`}
                        className={
                          ci === 0
                            ? "px-4 py-3 align-top font-medium text-[var(--color-of-ink)]"
                            : "px-4 py-3 align-top text-[var(--color-of-muted)]"
                        }
                      >
                        {renderText(cell, `${k}-r-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption ? (
            <figcaption className="mt-2 text-[12.5px] text-[var(--color-of-faint)]">
              {renderText(block.caption, `${k}-cap`)}
            </figcaption>
          ) : null}
        </figure>
      );
    default:
      return null;
  }
}

export function BlogPostView({ post }: { post: BlogPost }) {
  const related = getRelatedPosts(post.slug, 3);

  return (
    <div className="of-paper min-h-screen bg-[var(--color-of-canvas)] text-[var(--color-of-ink)]">
      {/* top chrome */}
      <header className="border-b border-[var(--color-of-line-soft)]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 py-4">
          <Link href="/" aria-label="otterfund home" className="inline-flex items-center">
            <LogoMark size={44} />
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            All posts
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 pb-24 pt-10 sm:pt-14">
        <article className="of-enter">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-of-faint)]">
            <span className="text-[var(--color-accent-foreground)]">{post.category}</span>
            <span aria-hidden>·</span>
            <span>{formatPostDate(post.publishedAt)}</span>
            <span aria-hidden>·</span>
            <span>{post.readMinutes} min read</span>
          </div>

          <h1
            className="mt-4 text-[clamp(30px,5vw,44px)] leading-[1.08] tracking-[-0.02em] text-[var(--color-of-ink)]"
            style={{ ...SERIF, fontWeight: 500 }}
          >
            {renderText(post.title, "title")}
          </h1>

          <p className="mt-5 text-[17px] leading-[1.6] text-[var(--color-of-muted)]">
            {renderText(post.excerpt, "excerpt")}
          </p>

          <hr className="mt-8 border-[var(--color-of-line-soft)]" />

          <div className="mt-2">
            {post.body.map((block, i) => (
              <Block key={i} block={block} index={i} />
            ))}
          </div>
        </article>

        {/* conversion CTA */}
        <aside className="mt-14 overflow-hidden rounded-[20px] border border-[var(--color-of-line)] bg-[var(--color-accent)] p-7 sm:p-9">
          <h2
            className="text-[22px] leading-[1.2] tracking-[-0.01em] text-[var(--color-of-ink)]"
            style={{ ...SERIF, fontWeight: 500 }}
          >
            Start budgeting with <Wordmark />
          </h2>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.65] text-[var(--color-of-muted)]">
            Split every dollar across Needs, Wants, and Savings, track your spending
            automatically, and let a calm AI advisor keep you on track. Free to get
            started, no credit card required.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-[14px] font-semibold text-[var(--color-primary-foreground)] transition-transform hover:-translate-y-[1px]"
          >
            Start for free
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </aside>

        {/* related posts */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-of-faint)]">
              Keep reading
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-[16px] border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_28px_oklch(20%_0.02_80/0.08)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--color-of-faint)]">
                    {r.category}
                  </div>
                  <div className="mt-1.5 text-[15px] font-semibold leading-[1.35] text-[var(--color-of-ink)]">
                    {renderText(r.title, `rel-${r.slug}`)}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-accent-foreground)]">
                    Read
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* footer */}
        <footer className="mt-16 flex flex-col gap-4 border-t border-[var(--color-of-line-soft)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-of-muted)]">
            <LogoMark size={16} />
            © {post.updatedAt.split("-")[0]} {LEGAL.service}
          </div>
          <nav className="flex items-center gap-5 text-[13px]" aria-label="Footer">
            <Link href="/blog" className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]">
              Blog
            </Link>
            <Link href="/pricing" className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]">
              Pricing
            </Link>
            <Link href="/privacy" className="text-[var(--color-of-muted)] transition-colors hover:text-[var(--color-of-ink)]">
              Privacy
            </Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
