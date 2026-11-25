import { Loader2 } from "lucide-react";
import { AdminButton } from "./AdminUi";

export function AdminSkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-2" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-[4px] border border-brand-surface_hover bg-brand-surface"
        />
      ))}
    </div>
  );
}

export function AdminLoadMore({
  visible,
  loading,
  onClick,
}: {
  visible: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="mt-4 flex justify-center">
      <AdminButton onClick={onClick} disabled={loading}>
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? "در حال دریافت..." : "نمایش موارد بیشتر"}
      </AdminButton>
    </div>
  );
}

export function AdminErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200"
    >
      <span>{message}</span>
      {onRetry && (
        <AdminButton onClick={onRetry} className="min-h-9 px-3 text-xs">
          تلاش مجدد
        </AdminButton>
      )}
    </div>
  );
}

export function AdminListCount({ count, hasMore }: { count: number; hasMore: boolean }) {
  return (
    <div className="mb-2 text-xs text-brand-m_khonsa">
      {count.toLocaleString("fa-IR")} مورد{hasMore ? " (و بیشتر)" : ""}
    </div>
  );
}