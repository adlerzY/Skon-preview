export default function DashboardContentSkeleton() {
  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black text-white">حساب کاربری</h1>
        <p className="mt-2 text-sm text-brand-m_khonsa">خلاصه حساب در حال به‌روزرسانی است.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        <div className="lg:col-span-2 h-[110px] bg-white/[.03] rounded" />
        <div className="h-[110px] bg-white/[.03] rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[92px] bg-white/[.03] rounded" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="h-full min-h-[240px] bg-white/[.03] rounded" />
        <div className="h-full min-h-[240px] bg-white/[.03] rounded" />
      </div>
    </div>
  );
}