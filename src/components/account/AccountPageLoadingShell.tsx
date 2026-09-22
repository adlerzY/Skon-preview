function Line({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-white/[.035] ${className}`} />;
}

export function AccountOrdersLoadingShell() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6" aria-hidden="true">
      <Line className="h-4 w-40" />
      <Line className="h-8 w-48" />
      <div className="bg-brand-surface border border-brand-surface_hover min-h-[120px]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Line key={i} className="h-9 w-24" />)}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 w-full bg-brand-surface border border-brand-surface_hover" />
        ))}
      </div>
    </div>
  );
}

export function AccountReviewsLoadingShell() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl" aria-hidden="true">
      <Line className="h-4 w-40" />
      <div>
        <Line className="h-8 w-48" />
        <Line className="h-4 w-72 mt-3" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 w-full bg-brand-surface border border-brand-surface_hover" />
        ))}
      </div>
    </div>
  );
}

export function AccountSettingsLoadingShell() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl" aria-hidden="true">
      <div>
        <Line className="h-8 w-48" />
        <Line className="h-4 w-80 mt-3" />
      </div>
      <div className="bg-brand-surface border border-brand-surface_hover p-6 min-h-[220px]" />
      <div className="bg-brand-surface border border-brand-surface_hover p-6 min-h-[150px]" />
      <div className="flex flex-col gap-3">
        <Line className="h-5 w-32" />
        <Line className="h-4 w-72" />
        <div className="h-28 w-full bg-brand-surface border border-brand-surface_hover" />
      </div>
    </div>
  );
}

export function AccountTicketsLoadingShell() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Line className="h-8 w-48" />
        <Line className="h-10 w-28" />
      </div>
      <div className="h-11 w-full bg-brand-surface border border-brand-surface_hover" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 w-full bg-brand-surface border border-brand-surface_hover" />
        ))}
      </div>
    </div>
  );
}
