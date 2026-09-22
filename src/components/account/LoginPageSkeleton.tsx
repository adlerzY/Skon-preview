export default function LoginPageSkeleton() {
  return (
    <div className="min-h-[100dvh] w-full bg-brand-bg flex flex-col overflow-hidden" dir="rtl" aria-busy="true">
      <header className="w-full flex items-center justify-between px-5 py-4 md:px-8 shrink-0">
        <div className="h-9 w-[130px] rounded bg-white/[.035]" />
        <div className="h-4 w-28 rounded bg-white/[.03]" />
      </header>

      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-4 md:p-5 overflow-y-auto pb-[calc(58px+env(safe-area-inset-bottom)+12px)] lg:pb-5">
        <section className="w-full max-w-md bg-brand-surface border border-brand-surface_hover p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 pb-5 border-b border-brand-surface_hover">
            <div className="h-9 w-[130px] rounded bg-white/[.035]" />
            <div className="h-3.5 w-28 rounded bg-white/[.03]" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-32 rounded bg-white/[.04]" />
            <div className="h-10 w-[88%] rounded bg-white/[.025]" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-brand-bg p-1 border border-brand-surface_hover">
            <div className="h-10 w-full rounded bg-white/[.04]" />
            <div className="h-10 w-full rounded bg-white/[.025]" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded bg-white/[.03]" />
              <div className="h-11 w-full rounded bg-brand-bg border border-brand-surface_hover" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-20 rounded bg-white/[.03]" />
              <div className="h-11 w-full rounded bg-brand-bg border border-brand-surface_hover" />
            </div>
            <div className="h-11 w-full rounded bg-brand-blue/10" />
          </div>
        </section>
      </main>

      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-[9997] bg-[#15171e] border-t border-white/5 h-[58px] grid grid-cols-4 items-center px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-white/[.03]" />
            <div className="w-10 h-2 rounded bg-white/[.03]" />
          </div>
        ))}
      </div>
    </div>
  );
}
