export default function Loading() {
  return (
    <div className="mx-auto h-full w-full max-w-[1500px]" aria-hidden="true">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="h-2.5 w-20 rounded bg-white/[.03]" />
          <div className="mt-3 h-8 w-40 rounded bg-white/[.035]" />
          <div className="mt-2 h-3 w-64 max-w-full rounded bg-white/[.025]" />
        </div>
        <div className="h-10 w-28 rounded-[5px] bg-white/[.03]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[104px] rounded-[5px] border border-brand-surface_hover bg-brand-surface" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="h-[330px] rounded-[5px] border border-brand-surface_hover bg-brand-surface" />
        <div className="h-[330px] rounded-[5px] border border-brand-surface_hover bg-brand-surface" />
      </div>
    </div>
  );
}
