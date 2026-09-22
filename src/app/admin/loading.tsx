export default function Loading() {
  return (
    <div className="mx-auto h-full w-full max-w-[1500px]" aria-busy="true">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">پنل مدیریت</h1>
          <p className="mt-2 text-sm text-brand-m_khonsa">اطلاعات زنده در حال دریافت است.</p>
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
