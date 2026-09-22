export default function ProductPageShell() {
  return (
    <div className="flex flex-col gap-10 w-full" dir="rtl" aria-hidden="true">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full items-start">
        <div className="lg:col-span-5 w-full order-2 lg:order-1">
          <div className="flex flex-col gap-4">
            <div className="h-8 w-[72%] rounded-md bg-white/[.035]" />
            <div className="h-11 w-full rounded-md bg-brand-surface border border-brand-surface_hover/60" />
            <div className="grid grid-cols-3 gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[72px] w-full rounded-md bg-brand-surface border border-brand-surface_hover/50" />
              ))}
            </div>
            <div className="h-[150px] w-full rounded-md bg-brand-surface border border-brand-surface_hover/50" />
          </div>
        </div>

        <div className="lg:col-span-7 w-full order-1 lg:order-2">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-surface border border-brand-surface_hover/60" />
            <div className="grid grid-cols-4 gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-full aspect-video bg-brand-surface border border-brand-surface_hover/50" />
              ))}
            </div>
            <div className="bg-brand-menu p-5 border border-brand-surface_hover/60 min-h-[110px]" />
          </div>
        </div>
      </div>

      <div className="w-full border-t border-brand-surface_hover/70 pt-8">
        <div className="h-7 w-44 rounded-md bg-white/[.035]" />
        <div className="mt-5 h-[180px] w-full rounded-md bg-brand-menu border border-brand-surface_hover/60" />
      </div>
    </div>
  );
}
