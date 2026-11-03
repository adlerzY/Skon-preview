import Skeleton from "@/components/ui/Skeleton";

function StepperSkeleton() {
  return (
    <div className="grid grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="flex h-5 items-center">
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PurchaseCardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5" aria-busy="true">
      <StepperSkeleton />

      <div className="skeleton-delayed flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-[74px] flex items-center gap-3 px-6 bg-brand-surface border border-brand-surface_hover"
          >
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-24 mr-auto" />
          </div>
        ))}
      </div>

      <Skeleton className="h-[52px] w-full" />
    </div>
  );
}

export function ProductGallerySkeleton() {
  return (
    <div className="skeleton-delayed flex flex-col sm:flex-row sm:items-stretch gap-3 w-full" aria-hidden="true">
      <div className="relative w-full sm:flex-1 aspect-[16/9] overflow-hidden bg-brand-surface border border-brand-surface_hover">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="flex sm:flex-col gap-2.5 w-full sm:w-[96px] lg:w-[108px] shrink-0 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="w-[86px] sm:w-full aspect-video shrink-0 border border-brand-surface_hover"
          />
        ))}
      </div>
    </div>
  );
}

export function ProductHeroSkeleton() {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 w-full items-stretch"
      aria-busy="true"
    >
      <div className="lg:col-span-4 w-full">
        <div className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
          <Skeleton className="h-9 w-64 max-w-full" />
          <PurchaseCardSkeleton />
        </div>
      </div>

      <div className="lg:col-span-8 w-full">
        <div className="flex flex-col gap-6 lg:sticky lg:top-[84px]">
          <ProductGallerySkeleton />
        </div>
      </div>
    </div>
  );
}

export function ProductBodySkeleton() {
  return (
    <div
      className="skeleton-delayed cv-auto w-full border-t border-brand-surface_hover pt-8 flex flex-col gap-6"
      aria-hidden="true"
    >
      <Skeleton className="h-7 w-48" />
      <div className="flex flex-col gap-3 bg-brand-menu p-6 border border-brand-surface_hover min-h-[260px]">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[94%]" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[70%]" />
      </div>
    </div>
  );
}