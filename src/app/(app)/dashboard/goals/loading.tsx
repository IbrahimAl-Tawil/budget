import { cn } from "@/lib/utils";
import { SkeletonPage, Skel, SkelHero } from "@/components/otterfund/skeleton";

// Goals (statement): saved-across-goals hero + Allocate/New actions + cut, then
// a two-up ledger of goals (ring · name + figures + funding · percent).
export default function Loading() {
  return (
    <SkeletonPage variant="statement">
      <SkelHero sub actions={2} cut />
      <div className="of-grid-2up mt-1.5 grid grid-cols-2 gap-14">
        {[0, 1].map((col) => (
          <div key={col}>
            {[0, 1].map((i) => (
              <div
                key={i}
                className={cn("grid items-center gap-4 py-[14px]", i > 0 && "border-t border-[var(--color-of-line-soft)]")}
                style={{ gridTemplateColumns: "52px 1fr auto" }}
              >
                <Skel className="h-[46px] w-[46px] shrink-0 rounded-full" />
                <div className="min-w-0">
                  <Skel className="h-4 w-2/5 rounded-md" />
                  <Skel className="mt-2 h-3 w-3/5 rounded-md" />
                  <Skel className="mt-2 h-3 w-1/2 rounded-md" />
                </div>
                <Skel className="h-6 w-12 rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
