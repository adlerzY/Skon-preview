import { Loader2 } from "lucide-react";

export default function LoginPageSkeleton() {
  return (
    <div className="h-[100dvh] w-full bg-brand-bg flex flex-col overflow-hidden" dir="rtl">
      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-5 pb-[calc(58px+env(safe-area-inset-bottom)+12px)] lg:pb-5">
        <div className="flex flex-col items-center gap-3 text-sm text-brand-m_khonsa" role="status" aria-live="polite">
          <Loader2 size={26} className="animate-spin text-brand-blue" />
          <span>در حال آماده‌سازی ورود...</span>
        </div>
      </main>

      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-[9997] bg-[#15171e] border-t border-white/5 h-[58px] grid grid-cols-4 items-center px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-white/[.03]" />
            <div className="w-10 h-2 bg-white/[.03]" />
          </div>
        ))}
      </div>
    </div>
  );
}
