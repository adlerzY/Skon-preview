export default function LoginPageSkeleton() {
  return (
    <section
      className="w-full max-w-md mx-auto bg-brand-surface border border-brand-surface_hover p-6 md:p-8 flex flex-col gap-6"
      dir="rtl"
      aria-busy="true"
    >
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
  );
}
