import { cn } from "@/lib/utils";
import { SkeletonPage, Skel, SkelHero, SkelSectionHead, SkelBarList, SkelAvatarRows, SkelPanel } from "@/components/otterfund/skeleton";

// Spending (statement + panels): spent-of-budget hero · a bucket trio (three
// stat panels) · a "Plan vs. actual" dual-donut panel · a grouped "Category
// breakdown" panel · a "Recurring" two-up of panels. Mirrors the redesigned
// page's card grammar so the content swap is calm.
export default function Loading() {
  return (
    <SkeletonPage variant="statement">
      <SkelHero sub cut />

      {/* bucket trio */}
      <Skel className="mt-9 mb-4 h-3 w-48 rounded-md" />
      <div className="of-trio">
        {[0, 1, 2].map((i) => (
          <SkelPanel key={i} padding="18px 18px">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skel className="h-4 w-4 rounded-md" />
                <Skel className="h-3.5 w-16 rounded-md" />
              </div>
              <Skel className="h-3 w-8 rounded-md" />
            </div>
            <Skel className="mt-3 h-6 w-24 rounded-lg" />
            <Skel className="mt-2 h-3 w-16 rounded-md" />
            <Skel className="mt-3.5 h-[6px] w-full rounded-full" />
            <Skel className="mt-2 h-3 w-20 rounded-md" />
          </SkelPanel>
        ))}
      </div>

      {/* plan vs. actual · dual donut */}
      <SkelPanel className="mt-6">
        <SkelSectionHead />
        <Skel className="mb-6 h-3 w-3/5 rounded-md" />
        <div className="flex flex-wrap justify-center gap-8">
          <Skel className="h-[168px] w-[168px] rounded-full" />
          <Skel className="h-[168px] w-[168px] rounded-full" />
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skel className="h-3.5 w-24 rounded-md" />
              <Skel className="h-3.5 w-36 rounded-md" />
            </div>
          ))}
        </div>
      </SkelPanel>

      {/* category breakdown */}
      <SkelPanel className="mt-6">
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
                  <Skel className="h-[26px] w-[26px] rounded-lg" />
                  <Skel className="h-3.5 w-28 rounded-md" />
                </div>
                <Skel className="h-3.5 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </SkelPanel>

      {/* recurring · two-up of panels */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <Skel className="h-3 w-24 rounded-md" />
            <Skel className="mt-2 h-3.5 w-56 rounded-md" />
          </div>
          <Skel className="h-9 w-40 rounded-full" />
        </div>
        <div className="of-grid-2up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <SkelPanel>
            <SkelSectionHead />
            <SkelAvatarRows rows={3} />
          </SkelPanel>
          <SkelPanel>
            <SkelSectionHead />
            <SkelBarList rows={3} />
          </SkelPanel>
        </div>
      </section>
    </SkeletonPage>
  );
}
