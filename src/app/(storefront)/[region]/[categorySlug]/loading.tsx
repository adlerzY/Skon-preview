import { ProductGridLayoutShell } from "@/components/home/HomeSkeletons";

function ContextNavShell() {
  return (
    <div className="w-full border-b border-brand-surface_hover" aria-hidden="true">
      <div className="flex min-h-[58px] items-center gap-7 overflow-hidden">
        <div className="h-4 w-40 rounded bg-white/[.05]" />
        <div className="h-4 w-28 rounded bg-white/[.035]" />
        <div className="h-4 w-20 rounded bg-white/[.035]" />
        <div className="h-4 w-24 rounded bg-white/[.035]" />
        <div className="h-4 w-20 rounded bg-white/[.035]" />
        <div className="h-4 w-24 rounded bg-white/[.035]" />
        <div className="h-4 w-16 rounded bg-white/[.035]" />
      </div>
    </div>
  );
}

function HeroShell() {
  return (
    <div className="w-full max-w-[1600px] mx-auto" aria-hidden="true">
      <div className="relative mt-1 h-[350px] w-full overflow-hidden bg-brand-surface border border-brand-surface_hover/60">
        <div className="absolute inset-0 bg-gradient-to-l from-brand-bg/70 via-brand-bg/20 to-transparent" />
        <div className="absolute inset-y-0 left-4 flex items-center">
          <div className="h-16 w-9 rounded-md bg-white/[.025] border border-white/[.04]" />
        </div>
        <div className="absolute inset-y-0 right-4 flex items-center">
          <div className="h-16 w-9 rounded-md bg-white/[.025] border border-white/[.04]" />
        </div>
        <div className="absolute inset-y-0 right-8 md:right-[5.5rem] flex w-full max-w-2xl flex-col justify-center">
          <div className="h-16 w-48 md:w-64 rounded-lg bg-white/[.035]" />
          <div className="mt-3 h-3 w-[62%] max-w-lg rounded bg-white/[.025]" />
          <div className="mt-2 h-10 w-32 rounded-md bg-white/[.03]" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="h-5 w-5 rounded-full bg-white/[.03]" />
        <div className="h-[5px] w-[150px] rounded-full bg-white/[.025]" />
      </div>
    </div>
  );
}

export default function CategoryLoading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 pb-12" aria-busy="true">
      <div className="mb-5 flex min-w-0 items-center gap-2" aria-hidden="true">
        <div className="h-7 w-7 rounded-full bg-white/[.03]" />
        <div className="h-3 w-16 rounded bg-white/[.025]" />
        <div className="h-3 w-28 rounded bg-white/[.025]" />
      </div>

      <HeroShell />
      <ContextNavShell />

      <div className="mt-8">
        <ProductGridLayoutShell showTitle />
      </div>
    </main>
  );
}
