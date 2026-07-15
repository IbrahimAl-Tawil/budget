// Loading-state placeholders for the route-level loading.tsx files. Pure
// server-safe markup built on the .of-skel shimmer block — each mirrors the
// page scaffold it stands in for, so the content swap is calm. Migrated pages
// use the "statement" grammar (hero + hairline rows directly on the canvas, no
// bordered cards); SkelCard/SkelCardHeader are kept for pages still on the old
// card layout (investments).

import { cn } from "@/lib/utils";
import { Card } from "./card";

export function Skel({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("of-skel", className)} style={style} aria-hidden="true" />;
}

/** Page root — the reading column + a loading announcement for AT. `statement`
    is the 860px column the redesigned pages use; `page` is the wider legacy one. */
export function SkeletonPage({
  children,
  variant = "page",
}: {
  children: React.ReactNode;
  variant?: "page" | "statement";
}) {
  return (
    <div className={variant === "statement" ? "of-statement" : "of-page"} role="status" aria-label="Loading page">
      {children}
    </div>
  );
}

/**
 * Hero band — eyebrow, display figure, optional sub-line, and on the right
 * either action-button pills or a sparkline block. `cut` draws the hairline that
 * seats the hero on the paper (matches <HeroBand>).
 */
export function SkelHero({
  sub = false,
  actions = 0,
  chart = false,
  cut = false,
}: {
  sub?: boolean;
  actions?: number;
  chart?: boolean;
  cut?: boolean;
}) {
  return (
    <>
      <section className="of-hero-row flex items-end justify-between gap-7 px-1 pb-7">
        <div>
          <Skel className="h-3 w-36 rounded-md" />
          <Skel className="mt-3.5 h-[44px] w-56 rounded-2xl" />
          {sub && <Skel className="mt-3 h-3.5 w-52 rounded-md" />}
        </div>
        {chart && <Skel className="hidden h-[110px] w-full max-w-[360px] rounded-2xl sm:block" />}
        {actions > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2.5 self-start">
            {Array.from({ length: actions }, (_, i) => (
              <Skel key={i} className="h-9 w-32 rounded-full" />
            ))}
          </div>
        )}
      </section>
      {cut && <div className="of-cut" />}
    </>
  );
}

/** Section header floating on the canvas: title left, optional "view all" right. */
export function SkelSectionHead({ link = true }: { link?: boolean }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <Skel className="h-4 w-32 rounded-md" />
      {link && <Skel className="h-3 w-24 rounded-md" />}
    </div>
  );
}

/** Label + amount line over a slim progress bar ("Where it went", buckets).
    `divided` gives the hairline row rhythm of a ledger; off = simple gaps. */
export function SkelBarList({ rows = 4, divided = false }: { rows?: number; divided?: boolean }) {
  return (
    <div className={cn(!divided && "flex flex-col gap-4")}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn(divided && "py-3.5", divided && i > 0 && "border-t border-[var(--color-of-line-soft)]")}>
          <div className="mb-2 flex items-center justify-between">
            <Skel className="h-3.5 w-24 rounded-md" />
            <Skel className="h-3.5 w-14 rounded-md" />
          </div>
          <Skel className="h-[7px] w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Leading tile/ring + name/sub-line + right figure (activity, services,
    accounts, goals). Rows are split by a hairline — the ledger row rhythm. */
export function SkelAvatarRows({
  rows = 5,
  divided = true,
  round = false,
  size = 40,
  lines = 2,
}: {
  rows?: number;
  divided?: boolean;
  /** Circle (progress ring) instead of a rounded tile. */
  round?: boolean;
  size?: number;
  lines?: number;
}) {
  return (
    <div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={cn("flex items-center gap-3 py-3", divided && i > 0 && "border-t border-[var(--color-of-line-soft)]")}
        >
          <Skel className={cn("shrink-0", round ? "rounded-full" : "rounded-xl")} style={{ width: size, height: size }} />
          <div className="min-w-0 flex-1">
            <Skel className="h-3.5 w-2/5 rounded-md" />
            {lines > 1 && <Skel className="mt-1.5 h-3 w-1/4 rounded-md" />}
            {lines > 2 && <Skel className="mt-1.5 h-3 w-1/3 rounded-md" />}
          </div>
          <Skel className="h-3.5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Card header: title left, hint/link right. (Legacy card layout.) */
export function SkelCardHeader() {
  return (
    <div className="mb-5 flex items-baseline justify-between">
      <Skel className="h-4 w-32 rounded-md" />
      <Skel className="h-3 w-24 rounded-md" />
    </div>
  );
}

/** Surface card with the standard header + a body. (Legacy card layout — kept
    for pages not yet on the statement grammar, e.g. investments.) */
export function SkelCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <SkelCardHeader />
      {children}
    </Card>
  );
}
