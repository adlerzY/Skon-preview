function Block({ className }: { className: string }) {
  return <div className={`rounded bg-white/[.035] ${className}`} />;
}

export default function ProductLoading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-8" aria-busy="true">
      <div className="mb-5 flex min-w-0 items-center gap-2" aria-hidden="true">
        <Block className="h-7 w-7 rounded-full" />
        <Block className="h-3 w-16" />
        <Block className="h-3 w-28" />
        <Block className="h-3 w-32" />
      </div>

      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10" aria-hidden="true">
        <div className="order-2 w-full lg:order-1 lg:col-span-4">
          <div className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
            <div>
              <Block className="h-9 w-64 max-w-full" />
              <Block className="mt-3 h-11 w-full" />
            </div>

            <div className="border border-brand-surface_hover bg-brand-surface p-4">
              <Block className="h-4 w-24" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Block key={index} className="h-12 w-full" />
                ))}
              </div>
            </div>

            <div className="border border-brand-surface_hover bg-brand-surface p-5">
              <Block className="h-4 w-28" />
              <Block className="mt-5 h-8 w-40" />
              <Block className="mt-3 h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="order-1 w-full lg:order-2 lg:col-span-8">
          <div className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
            <div className="aspect-[16/9] w-full overflow-hidden border border-brand-surface_hover bg-brand-surface" />

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Block key={index} className="aspect-[16/10] w-full" />
              ))}
            </div>

            <Block className="h-16 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
