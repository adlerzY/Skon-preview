"use client";

import { PriceDisplay } from "./PriceDisplay";

export interface PurchaseSummaryRow {
  label: string;
  value: string;
  onEdit?: () => void;
}

interface PurchaseSummaryProps {
  rows: PurchaseSummaryRow[];
  price: number | null;
  regularPrice: number | null;
  specialDiscount: boolean;
}

export default function PurchaseSummary({ rows, price, regularPrice, specialDiscount }: PurchaseSummaryProps) {
  return (
    <section aria-label="خلاصه سفارش" className="flex flex-col border border-brand-surface_hover bg-brand-menu">
      <div className="flex flex-col gap-3 p-4">
        <span className="border-b border-brand-surface_hover pb-2 text-[13px] font-bold text-brand-surface_m">
          خلاصه سفارش
        </span>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="shrink-0 text-brand-m_khonsa">{row.label}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-bold text-white">{row.value}</span>
              {row.onEdit && (
                <button
                  type="button"
                  onClick={row.onEdit}
                  className="shrink-0 text-[11px] font-bold text-brand-blue transition-colors hover:text-white"
                >
                  تغییر
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-brand-surface_hover bg-brand-surface p-4">
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium text-brand-m_khonsa">مبلغ قابل پرداخت</span>
          {specialDiscount && (
            <span className="self-start border border-brand-sabz/40 bg-brand-sabz/10 px-2 py-0.5 text-[10px] font-bold text-brand-sabz">
              تخفیف ویژه فروشگاه
            </span>
          )}
        </span>
        {typeof price === "number" ? (
          <PriceDisplay price={price} regularPrice={regularPrice ?? undefined} />
        ) : (
          <span className="text-base font-bold text-red-500">ناموجود</span>
        )}
      </div>
    </section>
  );
}