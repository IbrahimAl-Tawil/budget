import { SkeletonPage, Skel, SkelHero, SkelSectionHead, SkelBarList, SkelAvatarRows } from "@/components/otterfund/skeleton";

// Overview (statement): greeting · net-worth hero + sparkline + cut · this-month
// trio · "Where it went" + "Recent activity" two-up · "Goals" ledger · insight band.
export default function Loading() {
  return (
    <SkeletonPage variant="statement">
      {/* greeting */}
      <div className="pb-2">
        <Skel className="h-6 w-56 rounded-lg" />
        <Skel className="mt-2 h-3.5 w-48 rounded-md" />
      </div>

      <SkelHero chart cut />

      {/* this month · three figures split by hairlines */}
      <div className="mt-6 mb-2.5">
        <Skel className="h-3 w-28 rounded-md" />
      </div>
      <section className="of-trio">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center px-4">
            <Skel className="h-3.5 w-20 rounded-md" />
            <Skel className="mt-2.5 h-6 w-28 rounded-lg" />
            <Skel className="mt-2.5 h-3 w-24 rounded-md" />
          </div>
        ))}
      </section>

      {/* where it went · recent activity (two-up) */}
      <section className="of-grid-2up mt-9 grid grid-cols-2 gap-14">
        <div>
          <SkelSectionHead />
          <SkelBarList rows={5} divided />
        </div>
        <div>
          <SkelSectionHead />
          <SkelAvatarRows rows={5} />
        </div>
      </section>

      {/* goals */}
      <section className="mt-9">
        <SkelSectionHead />
        <SkelAvatarRows rows={3} round size={44} lines={2} />
      </section>

      {/* insight band */}
      <Skel className="mt-10 h-[150px] w-full rounded-[22px]" />
    </SkeletonPage>
  );
}
