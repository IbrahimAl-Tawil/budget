import { SkeletonPage, Skel, SkelBarList } from "@/components/otterfund/skeleton";
import { Card } from "@/components/otterfund/card";
import { cn } from "@/lib/utils";

// Mirrors the real Investments page (see pages/investments.tsx): a back-to-
// Accounts pill, the portfolio-value hero (no action buttons — left-aligned
// eyebrow · figure · sub · stat pill), the full-width allocation card (donut +
// legend), the full-width holdings list, and the accounts + by-institution 2-up.

/** Blossom-style row: leading tile + two-line label + two-line right figure —
    used for both Holdings (32px) and Accounts (34px). */
function Rows({ rows, size }: { rows: number; size: number }) {
  return (
    <div className="-mx-1">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={cn("flex items-center gap-3 px-2 py-3", i > 0 && "border-t border-[var(--color-of-line-soft)]")}
        >
          <Skel className="shrink-0 rounded-xl" style={{ width: size, height: size }} />
          <div className="min-w-0 flex-1">
            <Skel className="h-3.5 w-2/5 rounded-md" />
            <Skel className="mt-1.5 h-3 w-1/4 rounded-md" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Skel className="h-3.5 w-16 rounded-md" />
            <Skel className="h-3 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <SkeletonPage>
      {/* back to Accounts (Investments is a drill-in from the balance sheet) */}
      <Skel className="mb-[18px] h-8 w-[104px] rounded-full" />

      {/* hero · portfolio value — eyebrow, figure, sub-line, stat pill */}
      <section className="flex items-start justify-between gap-4 px-1 pb-8">
        <div>
          <Skel className="h-3 w-32 rounded-md" />
          <Skel className="mt-3 h-14 w-64 rounded-2xl" />
          <Skel className="mt-3.5 h-3.5 w-44 rounded-md" />
          <Skel className="mt-3 h-8 w-40 rounded-full" />
        </div>
      </section>

      {/* allocation · donut + legend (full width) */}
      <Card className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <Skel className="h-4 w-28 rounded-md" />
          <Skel className="h-3 w-52 rounded-md" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-[52px] pt-3.5 pb-2">
          {/* donut ring with centred label */}
          <div className="relative shrink-0" style={{ width: 236, height: 236 }}>
            <Skel className="rounded-full" style={{ width: 236, height: 236 }} />
            <div className="absolute rounded-full bg-[var(--color-of-surface)]" style={{ inset: 34 }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Skel className="h-2.5 w-12 rounded-md" />
              <Skel className="h-5 w-24 rounded-md" />
            </div>
          </div>
          {/* legend: dot · label · value · % */}
          <div className="min-w-[260px] flex-[0_1_460px]">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2">
                <Skel className="h-[11px] w-[11px] shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1">
                  <Skel className="h-3.5 w-24 rounded-md" />
                </div>
                <Skel className="h-3.5 w-14 shrink-0 rounded-md" />
                <Skel className="h-3 w-8 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* holdings · Blossom-style list (full width) */}
      <Card className="mt-4 p-6">
        <div className="mb-1.5 flex items-baseline justify-between">
          <Skel className="h-4 w-24 rounded-md" />
          <Skel className="h-3 w-16 rounded-md" />
        </div>
        <Rows rows={5} size={32} />
      </Card>

      {/* accounts + by institution */}
      <section className="of-grid-2up mt-4 grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="mb-1.5 flex items-baseline justify-between">
            <Skel className="h-4 w-24 rounded-md" />
            <Skel className="h-3 w-14 rounded-md" />
          </div>
          <Rows rows={3} size={34} />
        </Card>
        <Card className="p-6">
          <div className="mb-[18px] flex items-baseline justify-between">
            <Skel className="h-4 w-28 rounded-md" />
            <Skel className="h-3 w-24 rounded-md" />
          </div>
          <SkelBarList rows={3} />
        </Card>
      </section>
    </SkeletonPage>
  );
}
