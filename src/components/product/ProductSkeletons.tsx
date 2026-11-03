import Skeleton from "@/components/ui/Skeleton";
import PurchaseStepper from "./PurchaseStepper";

export function PurchaseCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full" aria-busy="true">
      <PurchaseStepper active={1} />

      <div className="skeleton-delayed flex flex-col gap-2.5">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="w-full h-[74px] flex items-center gap-3 px-6 bg-brand-menu border border-brand-surface_hover"
            >
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-24 mr-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="skeleton-delayed flex flex-col gap-3 border border-brand-surface_hover bg-brand-surface p-4">
        <div className="hidden lg:flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-[50px] w-full" />
      </div>
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