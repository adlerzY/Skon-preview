function Line({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-white/[.035] ${className}`} />;
}

export function AccountOrdersLoadingShell() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6" aria-busy="true">
      <div>
        <h1 className="text-2xl font-black text-white">سفارش‌های من</h1>
        <p className="mt-2 text-sm text-brand-m_khonsa">در حال دریافت آخرین وضعیت سفارش‌ها...</p>
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
    <div className="flex flex-col gap-6 max-w-2xl" aria-busy="true">
      <div>
        <h1 className="text-2xl font-black text-white">نظرهای من</h1>
        <p className="mt-2 text-sm text-brand-m_khonsa">نظرها در حال بارگذاری‌اند.</p>
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
    <div className="flex flex-col gap-6 max-w-2xl" aria-busy="true">
      <div>
        <h1 className="text-2xl font-black text-white">تنظیمات حساب</h1>
        <p className="mt-2 text-sm text-brand-m_khonsa">اطلاعات پروفایل و امنیت در حال دریافت است.</p>
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
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">تیکت‌های پشتیبانی</h1>
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
