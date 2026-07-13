import { cn } from "@/lib/utils";
import { SkeletonPage, Skel } from "@/components/otterfund/skeleton";

const ROW_GRID = { display: "grid", gridTemplateColumns: "26px 1fr auto", gap: 14 } as const;

// Transactions (statement): search + segment + account-filter toolbar, a
// select-all line, then day groups (floating date header + hairline rows).
export default function Loading() {
  return (
    <SkeletonPage variant="statement">
      {/* controls */}
      <div className="mb-2.5 flex flex-wrap items-center gap-3">
        <Skel className="h-[42px] min-w-[200px] flex-1 rounded-[13px]" />
        <Skel className="h-[42px] w-56 rounded-full" />
        <Skel className="h-9 w-32 rounded-full" />
      </div>

      {/* select-all line */}
      <div className="flex items-center gap-3 py-1.5">
        <Skel className="h-[18px] w-[18px] rounded-md" />
        <Skel className="h-3 w-28 rounded-md" />
      </div>

      {/* day groups */}
      {[3, 4].map((count, gi) => (
        <section key={gi}>
          <div className={cn("mb-0.5 flex items-baseline justify-between", gi === 0 ? "mt-3" : "mt-6")}>
            <div className="flex items-baseline gap-2.5">
              <Skel className="h-3.5 w-16 rounded-md" />
              <Skel className="h-3 w-14 rounded-md" />
            </div>
            <Skel className="h-3 w-16 rounded-md" />
          </div>
          <div>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={cn("items-center py-3", i > 0 && "border-t border-[var(--color-of-line-soft)]")} style={ROW_GRID}>
                <Skel className="h-[18px] w-[18px] rounded-md" />
                <div className="flex min-w-0 items-center gap-3">
                  <Skel className="h-9 w-9 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Skel className="h-3.5 w-2/5 rounded-md" />
                    <Skel className="mt-1.5 h-3 w-1/4 rounded-md" />
                  </div>
                </div>
                <Skel className="h-3.5 w-16 justify-self-end rounded-md" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </SkeletonPage>
  );
}
