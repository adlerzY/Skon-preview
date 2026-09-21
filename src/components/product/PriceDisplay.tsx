"use client";

import React from "react";

interface PriceDisplayProps {
  price: number | null;
  regularPrice?: number | null;
  giftPrice?: number | "disabled";
  codePrice?: number | "disabled";
  selectedType?: "standard" | "gift" | "code";
  compact?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  regularPrice = null,
  giftPrice,
  codePrice,
  selectedType = "standard",
  compact = false,
}) => {
  const formatPrice = (value: number | null) => {
    if (value === null || value === 0) return "رایگان";
    return value.toLocaleString("fa-IR") + " تومان";
  };

  const hasDiscount = typeof regularPrice === "number" && typeof price === "number" && regularPrice > price;
  
  const priceSizeClass = compact ? "text-sm md:text-base font-black" : "text-xl md:text-2xl font-black";
  const labelSizeClass = compact ? "text-xs font-bold" : "text-sm font-bold";
  const strikeSizeClass = compact ? "text-xs font-semibold" : "text-sm font-medium";

  const getDerivedRegularPrice = (currentPrice: number | "disabled" | undefined): number | null => {
    if (!hasDiscount || typeof regularPrice !== "number" || typeof price !== "number") return null;
    if (typeof currentPrice !== "number" || currentPrice < 0) return null;

    const discountRatio = (regularPrice - price) / regularPrice;
    if (discountRatio <= 0 || discountRatio >= 1) return null;

    return Math.round(currentPrice / (1 - discountRatio));
  };

  if (selectedType === "gift") {
    const isGiftDisabled = giftPrice === "disabled" || giftPrice === undefined;
    const derivedRegularPrice = !isGiftDisabled ? getDerivedRegularPrice(giftPrice) : null;

    return (
      <div className="flex items-center gap-2.5 whitespace-nowrap" dir="rtl">
        {!compact && <span className={`${labelSizeClass} text-brand-white`}>تحویل گیفت:</span>}
        {derivedRegularPrice && (
          <span className={`${strikeSizeClass} text-brand-surface_m line-through decoration-brand-surface_m/80`}>
            {formatPrice(derivedRegularPrice)}
          </span>
        )}
        <span className={`${priceSizeClass} ${isGiftDisabled ? "text-red-500" : derivedRegularPrice ? "text-brand-sabz" : "text-brand-white"}`}>
          {isGiftDisabled ? "غیرفعال" : formatPrice(giftPrice as number)}
        </span>
      </div>
    );
  }

  if (selectedType === "code") {
    const isCodeDisabled = codePrice === "disabled" || codePrice === undefined;
    const derivedRegularPrice = !isCodeDisabled ? getDerivedRegularPrice(codePrice) : null;

    return (
      <div className="flex items-center gap-2.5 whitespace-nowrap" dir="rtl">
        {!compact && <span className={`${labelSizeClass} text-brand-white`}>کد مستقیم:</span>}
        {derivedRegularPrice && (
          <span className={`${strikeSizeClass} text-brand-surface_m line-through decoration-brand-surface_m/80`}>
            {formatPrice(derivedRegularPrice)}
          </span>
        )}
        <span className={`${priceSizeClass} ${isCodeDisabled ? "text-red-500" : derivedRegularPrice ? "text-brand-sabz" : "text-brand-white"}`}>
          {isCodeDisabled ? "غیرفعال" : formatPrice(codePrice as number)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap" dir="rtl">
      {hasDiscount && (
        <span className={`${strikeSizeClass} text-brand-surface_m line-through decoration-brand-surface_m/80`}>
          {formatPrice(regularPrice)}
        </span>
      )}
      <span className={`${priceSizeClass} ${hasDiscount ? "text-brand-sabz" : "text-brand-white"}`}>
        {formatPrice(price)}
      </span>
    </div>
  );
};