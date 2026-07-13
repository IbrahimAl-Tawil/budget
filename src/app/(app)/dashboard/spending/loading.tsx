import { cn } from "@/lib/utils";
import { SkeletonPage, Skel, SkelHero, SkelSectionHead, SkelBarList, SkelAvatarRows } from "@/components/otterfund/skeleton";

// Spending (statement): spent-of-budget hero + cut · "Plan vs. actual" dual
// donut + legend · "Bucket progress" bars · "Category breakdown" grouped rows ·
// "Recurring" services ledger.
export default function Loading() {
  return (
    <SkeletonPage variant="statement">
      <SkelHero cut />

      {/* plan vs. actual */}
      <section className="mt-8">
        <SkelSectionHead />
        <Skel className="mb-6 h-3 w-3/5 rounded-md" />
        <div className="flex flex-wrap justify-center gap-8">
          <Skel className="h-[150px] w-[150px] rounded-full" />
          <Skel className="h-[150px] w-[150px] rounded-full" />
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skel className="h-3.5 w-24 rounded-md" />
              <Skel className="h-3.5 w-36 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* bucket progress */}
      <section className="mt-9">
        <SkelSectionHead link={false} />
        <SkelBarList rows={3} divided />
      </section>

      {/* category breakdown */}
      <section className="mt-9">
        <SkelSectionHead link={false} />
        {[0, 1, 2].map((g) => (
          <div key={g} className="mt-[18px]">
            <div className="mb-1 flex items-center gap-2">
              <Skel className="h-[9px] w-[9px] rounded-full" />
              <Skel className="h-3 w-24 rounded-md" />
              <Skel className="ml-auto h-3 w-14 rounded-md" />
            </div>
            {[0, 1].map((r) => (
              <div
                key={r}
                className={cn("flex items-center justify-between py-2.5", r > 0 && "border-t border-[var(--color-of-line-soft)]")}
              >
                <div className="flex items-center gap-2.5">
                  <Skel className="h-[9px] w-[9px] rounded-full" />
                  <Skel className="h-3.5 w-28 rounded-md" />
                </div>
                <Skel className="h-3.5 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* recurring */}
      <section className="mt-10">
        <div className="mb-1.5 flex items-center justify-between gap-4">
          <Skel className="h-4 w-28 rounded-md" />
          <Skel className="h-9 w-40 rounded-full" />
        </div>
        <Skel className="mb-2 h-3.5 w-64 rounded-md" />
        <SkelAvatarRows rows={4} />
      </section>
    </SkeletonPage>
  );
}
