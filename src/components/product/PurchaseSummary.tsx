"use client";

import { PriceDisplay } from "./PriceDisplay";
import ConfettiBurst from "@/components/ui/ConfettiBurst";

export interface PurchaseSummaryRow {
  label: string;
  value: string;
  muted?: boolean;
  onEdit?: () => void;
}

interface PurchaseSummaryProps {
  rows: PurchaseSummaryRow[];
  compactText: string;
  showPrice: boolean;
  price: number | null;
  regularPrice: number | null;
  primaryLabel: string;
  primaryDisabled: boolean;
  onPrimary: () => void;
  onBack?: () => void;
  burstKey: number;
}

export default function PurchaseSummary({
  rows,
  compactText,
  showPrice,
  price,
  regularPrice,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onBack,
  burstKey,
}: PurchaseSummaryProps) {
  const priceNode = !showPrice ? (
    <span className="text-xs leading-5 text-brand-surface_m">ابتدا روش تحویل را انتخاب کنید</span>
  ) : typeof price === "number" ? (
    <>
      <span className="lg:hidden">
        <PriceDisplay price={price} regularPrice={regularPrice ?? undefined} compact />
      </span>
      <span className="hidden lg:block">
        <PriceDisplay price={price} regularPrice={regularPrice ?? undefined} />
      </span>
    </>
  ) : (
    <span className="text-base font-bold text-red-500">ناموجود</span>
  );

  return (
    <div className="sticky bottom-[calc(58px+env(safe-area-inset-bottom)+8px)] z-[9995] flex flex-col gap-2.5 border border-brand-surface_hover bg-brand-surface p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.45)] lg:static lg:z-auto lg:gap-3 lg:p-4 lg:shadow-none">
      <div className="hidden flex-col gap-2 lg:flex">
        <span className="border-b border-brand-surface_hover pb-2 text-sm font-bold text-brand-surface_m">
          خلاصه سفارش
        </span>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="shrink-0 text-brand-m_khonsa">{row.label}:</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className={`truncate font-bold ${row.muted ? "text-brand-surface_m" : "text-white"}`}>
                {row.value}
              </span>
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

      <p className="truncate text-[11px] text-brand-m_khonsa lg:hidden">{compactText}</p>

      <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 lg:flex-none">
          <span className="hidden text-sm font-medium text-brand-surface_m lg:inline">مبلغ نهایی:</span>
          {priceNode}
        </div>

        <div className="flex items-center gap-2 lg:w-full">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 border border-brand-surface_hover bg-brand-bg px-3 py-3 text-xs font-bold text-brand-m_khonsa transition-colors hover:border-brand-m_khonsa hover:text-white lg:py-4"
            >
              بازگشت
            </button>
          )}
          <div className="relative lg:flex-1">
            <ConfettiBurst trigger={burstKey} />
            <button
              type="button"
              onClick={onPrimary}
              disabled={primaryDisabled}
              className={`w-full px-4 py-3 text-sm font-bold leading-5 transition-colors lg:py-4 ${
                primaryDisabled
                  ? "cursor-not-allowed bg-brand-surface_hover text-brand-m_khonsa"
                  : "bg-brand-blue text-brand-active hover:bg-[#0062d1]"
              }`}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}