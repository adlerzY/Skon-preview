export default function ProductPageShell() {
  return (
    <div className="flex flex-col gap-12 w-full" dir="rtl" aria-hidden="true">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 w-full items-stretch">
          <div className="lg:col-span-4 w-full">
            <div className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
              <div className="h-9 w-[78%] rounded-md bg-white/[.035]" />
              <div className="h-10 w-full rounded-md bg-brand-surface border border-brand-surface_hover/60" />
              <div className="flex flex-col gap-2.5">
                <div className="h-[76px] w-full rounded-md bg-brand-surface border border-brand-surface_hover/50" />
                <div className="h-[76px] w-full rounded-md bg-brand-surface border border-brand-surface_hover/50" />
                <div className="h-[76px] w-full rounded-md bg-brand-surface border border-brand-surface_hover/50" />
              </div>
              <div className="h-[180px] w-full rounded-md bg-brand-surface border border-brand-surface_hover/50" />
            </div>
          </div>

          <div className="lg:col-span-8 w-full">
            <div className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
              <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 w-full">
                <div className="relative flex-1 aspect-[16/9] w-full overflow-hidden bg-brand-surface border border-brand-surface_hover/60" />
                <div className="w-full sm:w-[96px] lg:w-[108px] shrink-0 flex flex-row sm:flex-col gap-2.5 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-[86px] sm:w-full aspect-video shrink-0 bg-brand-surface border border-brand-surface_hover/50" />
                  ))}
                </div>
              </div>
              <div className="bg-brand-menu p-6 border border-brand-surface_hover/60 min-h-[122px]" />
            </div>
          </div>
        </div>

        <div className="w-full border-t border-brand-surface_hover/70 pt-8">
          <div className="h-7 w-48 rounded-md bg-white/[.035]" />
          <div className="mt-6 h-[220px] w-full rounded-md bg-brand-menu border border-brand-surface_hover/60" />
        </div>
    </div>
  );
}
