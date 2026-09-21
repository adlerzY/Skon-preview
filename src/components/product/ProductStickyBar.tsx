"use client";

import { PriceDisplay } from "./PriceDisplay";

interface GroupedAttribute {
  name: string;
  values: { value: string; flagUrl?: string }[];
}

export interface DeliveryOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ProductStickyBarProps {
  visible: boolean;
  productName: string;
  groupedAttributes: GroupedAttribute[];
  selectedAttrs: Record<string, string>;
  onAttributeSelect: (name: string, value: string) => void;
  deliveryOptions?: DeliveryOption[];
  selectedDelivery?: string;
  onDeliverySelect?: (value: string) => void;
  price: number | null;
  regularPrice: number | null;
  inventoryHint?: string | null;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCtaClick: () => void;
}

export default function ProductStickyBar({
  visible,
  productName,
  groupedAttributes,
  selectedAttrs,
  onAttributeSelect,
  deliveryOptions,
  selectedDelivery,
  onDeliverySelect,
  price,
  regularPrice,
  inventoryHint,
  ctaLabel,
  ctaDisabled = false,
  onCtaClick,
}: ProductStickyBarProps) {
  return (
    <div
      dir="rtl"
      aria-hidden={!visible}
      className={`fixed top-[60px] lg:top-[80px] inset-x-0 z-[9500] bg-[#15171e] border-b border-brand-surface_hover shadow-[0_8px_20px_rgba(0,0,0,0.6)] transition-transform duration-200 ease-out ${
        visible ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="container mx-auto max-w-site px-4 md:px-6 h-[58px] md:h-[62px] flex items-center gap-3 md:gap-4">
        <span className="hidden sm:block text-sm font-bold text-white truncate max-w-[150px] md:max-w-[200px] shrink-0">
          {productName}
        </span>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide py-1">
          {groupedAttributes.map((group) => {
            const cleanName = group.name.replace("pa_", "").replace("attribute_", "");
            return (
              <select
                key={group.name}
                value={selectedAttrs[group.name] ?? ""}
                onChange={(e) => onAttributeSelect(group.name, e.target.value)}
                className="bg-brand-surface border border-brand-surface_hover hover:border-brand-surface_m text-white text-xs font-bold px-2.5 py-1.5 focus:outline-none focus:border-brand-blue cursor-pointer shrink-0 min-w-[110px]"
                aria-label={cleanName}
              >
                {group.values.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-brand-surface text-white">
                    {opt.value}
                  </option>
                ))}
              </select>
            );
          })}

          {deliveryOptions && deliveryOptions.length > 0 && (
            <select
              value={selectedDelivery ?? ""}
              onChange={(e) => onDeliverySelect?.(e.target.value)}
              className="bg-brand-surface border border-brand-surface_hover hover:border-brand-surface_m text-brand-zard text-xs font-bold px-2.5 py-1.5 focus:outline-none focus:border-brand-blue cursor-pointer shrink-0 min-w-[120px]"
              aria-label="روش تحویل"
            >
              {deliveryOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-brand-surface text-white"
                >
                  {opt.label} {opt.disabled ? "(ناموجود)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            {inventoryHint ? <span className="text-[9px] font-black text-brand-zard whitespace-nowrap">{inventoryHint}</span> : null}
            {typeof price === "number" ? (
              <PriceDisplay price={price} regularPrice={regularPrice ?? undefined} compact />
            ) : (
              <span className="text-red-500 font-bold text-xs whitespace-nowrap">ناموجود</span>
            )}
          </div>
          <div className="md:hidden">
            {typeof price === "number" ? (
              <PriceDisplay price={price} regularPrice={regularPrice ?? undefined} compact />
            ) : (
              <span className="text-red-500 font-bold text-xs whitespace-nowrap">ناموجود</span>
            )}
          </div>
          <button
            type="button"
            onClick={onCtaClick}
            disabled={ctaDisabled}
            className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 md:px-5 py-2 md:py-2.5 whitespace-nowrap transition-colors"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}