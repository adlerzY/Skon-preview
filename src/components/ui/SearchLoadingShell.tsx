export default function SearchLoadingShell() {
  return (
    <div className="w-full overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-white/5 bg-brand-surface">
            <div className="aspect-[16/10] bg-white/[.035]" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-4/5 rounded bg-white/[.05]" />
              <div className="h-3 w-2/5 rounded bg-white/[.04]" />
              <div className="h-9 w-full rounded-lg bg-white/[.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
