import Skeleton from "@/components/ui/Skeleton";

export default function DashboardContentSkeleton() {
  return (
    <div className="w-full min-w-0 h-full flex flex-col gap-4" aria-busy="true">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0 w-full">
        <div className="lg:col-span-2 w-full min-w-0 bg-brand-surface border border-brand-surface_hover p-5 flex items-center gap-5">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="h-3.5 w-48 max-w-full" />
            <Skeleton className="h-8 w-28 max-w-full" />
          </div>
          <div className="hidden sm:flex flex-col items-center gap-2 shrink-0">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        <div className="w-full min-w-0 bg-brand-surface border border-brand-surface_hover p-5 flex items-center justify-center">
          <div className="w-full flex flex-col gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 shrink-0 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-full min-w-0 bg-brand-surface border border-brand-surface_hover p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-4 h-4 rounded" />
            </div>
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 w-full">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="w-full min-w-0 min-h-[220px] bg-brand-surface border border-brand-surface_hover p-5 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-surface_hover pb-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((__, row) => (
                <div key={row} className="flex items-center justify-between gap-3 py-2.5 border-b border-brand-surface_hover last:border-0">
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-40 max-w-[80%]" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-6 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
