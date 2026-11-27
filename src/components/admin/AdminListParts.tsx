import { Loader2 } from "lucide-react";
import { AdminButton } from "./AdminUi";

export function AdminSkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="flex min-h-14 items-center gap-2 border-b border-brand-surface_hover py-3 text-[13px] text-brand-m_khonsa" aria-busy="true">
      <Loader2 size={15} className="animate-spin text-brand-blue" />
      <span>در حال دریافت اطلاعات…</span>
      <span className="sr-only">{count}</span>
    </div>
  );
}

export function AdminLoadMore({ visible, loading, onClick }: { visible: boolean; loading: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <div className="mt-4 flex justify-center">
      <AdminButton onClick={onClick} disabled={loading}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        {loading ? "در حال دریافت…" : "نمایش موارد بیشتر"}
      </AdminButton>
    </div>
  );
}

export function AdminErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 border-r-2 border-brand-zard bg-brand-zard/10 px-4 py-2.5 text-[13px] text-brand-zard">
      <span>{message}</span>
      {onRetry ? <AdminButton onClick={onRetry}>تلاش دوباره</AdminButton> : null}
    </div>
  );
}

export function AdminListCount({ count, hasMore }: { count: number; hasMore: boolean }) {
  return <div className="mb-2 text-[12px] text-brand-surface_m">نمایش {count.toLocaleString("fa-IR")} مورد{hasMore ? " و موارد بیشتر" : ""}</div>;
}