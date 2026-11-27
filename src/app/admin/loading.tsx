import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="w-full" aria-busy="true">
      <div className="mb-5 border-b border-brand-surface_hover pb-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-6 w-40" />
      </div>
      <div className="grid grid-cols-1 divide-y divide-brand-surface_hover border-y border-brand-surface_hover sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="px-4 py-3">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-2 h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}