import { SkeletonPage, Skel, SkelHero, SkelAvatarRows } from "@/components/otterfund/skeleton";

// Accounts (statement): net-worth hero + Connect/Add actions + sparkline + cut,
// then grouped account lists (group label + subtotal above hairline rows).
export default function Loading() {
  return (
    <SkeletonPage variant="statement">
      <SkelHero actions={2} />
      <Skel className="mt-1 h-[104px] w-full rounded-2xl" />
      <div className="of-cut mt-6" />

      {[3, 2].map((rows, i) => (
        <section key={i} className="mt-6">
          <div className="mb-1 flex items-baseline justify-between">
            <Skel className="h-3 w-28 rounded-md" />
            <Skel className="h-3.5 w-20 rounded-md" />
          </div>
          <SkelAvatarRows rows={rows} size={40} />
        </section>
      ))}
    </SkeletonPage>
  );
}
