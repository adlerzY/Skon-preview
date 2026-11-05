import Skeleton from "@/components/ui/Skeleton";
import { ProductHeroSkeleton } from "@/components/product/ProductSkeletons";

export default function ProductLoading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 pt-2 pb-4" aria-busy="true">
      <div className="mb-3 flex min-w-0 items-center gap-2" aria-hidden="true">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-32" />
      </div>

      <div className="flex flex-col gap-6 w-full" dir="rtl">
        <ProductHeroSkeleton />
      </div>
    </main>
  );
}
