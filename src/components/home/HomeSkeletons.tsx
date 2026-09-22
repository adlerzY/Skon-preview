export function HeroLayoutShell() {
  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="relative w-full h-[350px] mt-1 overflow-hidden bg-brand-surface border border-brand-surface_hover/60">
        <div className="absolute inset-0 bg-gradient-to-l from-brand-bg/60 via-brand-bg/10 to-transparent" />
        <div className="absolute inset-y-0 left-4 z-20 flex items-center">
          <div className="h-16 w-9 rounded-md bg-white/[.025] border border-white/[.04]" />
        </div>
        <div className="absolute inset-y-0 right-4 z-20 flex items-center">
          <div className="h-16 w-9 rounded-md bg-white/[.025] border border-white/[.04]" />
        </div>
        <div className="absolute bottom-5 right-8 md:right-[5.5rem] left-8 md:left-[5.5rem]">
          <div className="h-10 w-44 md:w-60 rounded-lg bg-white/[.035]" />
          <div className="mt-3 h-3 w-[62%] max-w-md rounded bg-white/[.025]" />
          <div className="mt-2 h-10 w-28 rounded-md bg-white/[.03]" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="h-5 w-5 rounded-full bg-white/[.03]" />
        <div className="h-[5px] w-[150px] rounded-full bg-white/[.025]" />
      </div>
    </div>
  );
}

export function ProductGridLayoutShell({ showTitle = true }: { showTitle?: boolean } = {}) {
  return (
    <section className={showTitle ? "w-full my-4" : "w-full"} aria-hidden="true">
      {showTitle && (
        <div className="flex items-center justify-between mt-5 mb-5">
          <div className="h-7 w-48 rounded-lg bg-white/[.035]" />
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden bg-brand-surface border border-brand-surface_hover/50 min-h-[300px] md:min-h-[380px]"
          >
            <div className="relative w-full aspect-[16/10] bg-white/[.02]" />
            <div className="p-4 md:p-5 flex flex-col min-h-[150px] gap-3">
              <div className="h-3 w-20 rounded bg-white/[.03]" />
              <div className="h-5 w-[82%] rounded bg-white/[.035]" />
              <div className="h-3 w-[60%] rounded bg-white/[.025]" />
              <div className="mt-auto h-8 w-[48%] rounded bg-white/[.03] self-end" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export const HeroSkeleton = HeroLayoutShell;
export const ProductGridSkeleton = ProductGridLayoutShell;
