function SurfaceLine({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-white/[.035] ${className}`} />;
}

function PostRowShell() {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-4 w-full bg-brand-surface border border-brand-surface_hover/60 overflow-hidden min-h-[140px]">
      <div className="bg-white/[.02]" />
      <div className="p-4 flex flex-col gap-3">
        <SurfaceLine className="h-4 w-24" />
        <SurfaceLine className="h-5 w-[72%]" />
        <SurfaceLine className="h-3 w-[92%]" />
        <SurfaceLine className="h-3 w-[58%]" />
      </div>
    </div>
  );
}

export function BlogArchiveLoadingShell() {
  return (
    <main className="container mx-auto px-6 py-12 max-w-site" aria-hidden="true">
      <SurfaceLine className="h-8 w-64" />
      <SurfaceLine className="h-4 w-40 mt-3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[220px] bg-brand-surface border border-brand-surface_hover/60" />)}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => <PostRowShell key={i} />)}
      </div>
    </main>
  );
}

export function BlogCategoryLoadingShell() {
  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-site" aria-hidden="true">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <SurfaceLine className="h-8 w-56" />
          <SurfaceLine className="h-4 w-40 mt-2" />
        </div>
        <SurfaceLine className="h-10 w-32" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <SurfaceLine key={i} className="h-8 w-20" />)}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => <PostRowShell key={i} />)}
      </div>
    </main>
  );
}

export function BlogPostLoadingShell() {
  return (
    <div className="w-full" aria-hidden="true">
      <div className="w-full h-[220px] sm:h-[300px] md:h-[420px] bg-brand-surface border border-brand-surface_hover/60 mb-6 md:mb-8" />
      <div className="mb-6 md:mb-8 flex flex-col gap-3">
        <SurfaceLine className="h-8 w-3/4" />
        <div className="flex gap-3">
          <SurfaceLine className="h-4 w-24" />
          <SurfaceLine className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="order-2 lg:order-1 lg:col-span-3 h-48 bg-brand-surface border border-brand-surface_hover/60" />
        <div className="order-1 lg:order-2 lg:col-span-6 bg-brand-menu border border-brand-surface_hover/60 p-6 min-h-[420px]">
          <SurfaceLine className="h-6 w-40" />
          <SurfaceLine className="h-4 w-full mt-6" />
          <SurfaceLine className="h-4 w-full mt-3" />
          <SurfaceLine className="h-4 w-5/6 mt-3" />
          <SurfaceLine className="h-4 w-full mt-3" />
        </div>
        <div className="order-3 lg:col-span-3 h-40 bg-brand-surface border border-brand-surface_hover/60" />
      </div>
    </div>
  );
}

export function BlogTagLoadingShell() {
  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-site" aria-hidden="true">
      <SurfaceLine className="h-3 w-16" />
      <SurfaceLine className="h-8 w-40 mt-2 mb-8" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => <PostRowShell key={i} />)}
      </div>
    </main>
  );
}

export function BlogArchivePostsLoadingShell() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="relative max-w-md h-11 bg-brand-surface border border-brand-surface_hover/60" />
      <div className="flex flex-col gap-4">
        <SurfaceLine className="h-6 w-28" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-brand-surface border border-brand-surface_hover/60" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => <PostRowShell key={i} />)}
      </div>
    </div>
  );
}

export function BlogCategoryPostsLoadingShell({ tabCount }: { tabCount: number }) {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {tabCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: Math.min(tabCount + 1, 5) }).map((_, i) => (
            <SurfaceLine key={i} className="h-9 w-20" />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => <PostRowShell key={i} />)}
      </div>
    </div>
  );
}

export function BlogTagPostsLoadingShell() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => <PostRowShell key={i} />)}
    </div>
  );
}
