import Skeleton from "@/components/ui/Skeleton";

export function HeroSkeleton() {
  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="relative w-full h-[350px] mt-1 overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="flex items-center justify-center mt-3">
        <Skeleton className="h-[5px] w-[150px] rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between mt-5 mb-5">
        <Skeleton className="h-8 w-56 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[380px] w-full" />
        ))}
      </div>
    </div>
  );
}