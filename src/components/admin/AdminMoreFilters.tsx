import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

export function AdminFilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] text-brand-m_khonsa">
      {label}
      {children}
    </label>
  );
}

export default function AdminMoreFilters({ activeCount = 0, children }: { activeCount?: number; children: ReactNode }) {
  return (
    <details className="relative lg:flex-none">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-[5px] border border-brand-surface_hover bg-brand-surface px-4 text-[13px] font-medium text-brand-m_khonsa transition-colors hover:text-brand-white marker:content-none [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal size={14} />
        فیلتر بیشتر
        {activeCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-brand-blue px-1 text-[11px] text-brand-white">
            {activeCount.toLocaleString("fa-IR")}
          </span>
        ) : null}
      </summary>
      <div className="absolute right-0 top-full z-20 mt-1 flex w-[min(260px,calc(100vw-2rem))] flex-col gap-3 rounded-[5px] border border-brand-surface_hover bg-brand-surface p-3 shadow-xl">
        {children}
      </div>
    </details>
  );
}