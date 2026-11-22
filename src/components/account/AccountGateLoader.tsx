import { Loader2 } from "lucide-react";

export default function AccountGateLoader() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="h-[100dvh] w-full bg-brand-bg flex items-center justify-center"
      dir="rtl"
    >
      <div className="skeleton-delayed flex flex-col items-center gap-3 text-brand-m_khonsa">
        <Loader2 size={26} className="animate-spin text-brand-blue" />
        <span className="text-xs font-bold">در حال بررسی حساب کاربری...</span>
      </div>
    </div>
  );
}
