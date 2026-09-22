export default function AccountLayoutSkeleton() {
  const navItems = ["نمای کلی", "سفارش‌ها", "تیکت‌ها", "نظرهای من", "تنظیمات"];
  return (
    <div className="h-screen w-full bg-brand-bg flex overflow-hidden" dir="rtl">
      <aside className="hidden lg:flex flex-col shrink-0 w-[260px] h-screen bg-brand-surface border-l border-brand-surface_hover p-6 gap-3">
        <div className="flex flex-col items-center gap-3 pb-6 mb-3 border-b border-brand-surface_hover">
          <div className="w-16 h-16 rounded-full bg-white/[.03]" />
          <div className="w-24 h-4 bg-white/[.03] rounded" />
        </div>
        {navItems.map((item) => (
          <div key={item} className="w-full min-h-9 px-3 flex items-center text-sm font-bold text-brand-m_khonsa">{item}</div>
        ))}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <div className="h-[58px] shrink-0 border-b border-brand-surface_hover flex items-center justify-between px-3 md:px-6 bg-brand-surface/50">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 bg-white/[.03] rounded" />
            <div className="w-8 h-8 rounded-full bg-white/[.03]" />
            <span className="hidden sm:block text-sm font-bold text-white">حساب کاربری</span>
          </div>
          <div className="w-9 h-9 bg-white/[.03]" />
        </div>

        <main className="flex-1 min-h-0 w-full p-4 md:p-6 pb-[calc(58px+env(safe-area-inset-bottom)+16px)] lg:pb-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 h-[110px] bg-white/[.03] rounded" />
            <div className="h-[110px] bg-white/[.03] rounded" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[92px] bg-white/[.03] rounded" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-[280px] bg-white/[.03] rounded" />
            <div className="h-[280px] bg-white/[.03] rounded" />
          </div>
        </main>
      </div>

      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-[9997] bg-[#15171e] border-t border-white/5 h-[58px] grid grid-cols-4 items-center px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-white/[.03]" />
            <div className="w-8 h-2 bg-white/[.03]" />
          </div>
        ))}
      </div>
    </div>
  );
}