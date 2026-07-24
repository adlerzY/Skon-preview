import React from 'react';

interface PriceDisplayProps {
  price: number | null;
  regularPrice?: number | null;
  giftPrice?: number | 'disabled';
  codePrice?: number | 'disabled';
  selectedType?: 'standard' | 'gift' | 'code';
  compact?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  regularPrice = null,
  giftPrice,
  codePrice,
  selectedType = 'standard',
  compact = false,
}) => {
  const formatPrice = (value: number | null) => {
    if (value === null || value === 0) return 'رایگان';
    return value.toLocaleString('fa-IR') + ' تومان';
  };

  const hasDiscount = Boolean(regularPrice && price && regularPrice > price);
  const priceSizeClass = compact ? 'text-sm font-black' : 'text-2xl font-black';
  const labelSizeClass = compact ? 'text-[10px]' : 'text-xs';
  const strikeSizeClass = compact ? 'text-[10px]' : 'text-sm';

  const getDerivedRegularPrice = (currentPrice: number | 'disabled' | undefined): number | null => {
    if (!hasDiscount || !regularPrice || !price) return null;
    if (typeof currentPrice !== 'number' || currentPrice <= 0) return null;

    const discountRatio = (regularPrice - price) / regularPrice;
    if (discountRatio <= 0 || discountRatio >= 1) return null;

    return Math.round(currentPrice / (1 - discountRatio));
  };

  if (selectedType === 'gift') {
    const isGiftDisabled = giftPrice === 'disabled' || !giftPrice;
    const derivedRegularPrice = !isGiftDisabled ? getDerivedRegularPrice(giftPrice) : null;

    return (
      <div className="flex flex-col gap-1 items-center">
        <span className={`${labelSizeClass} text-neutral-400`}>قیمت تحویل به‌صورت گیفت</span>
        {derivedRegularPrice && (
          <span className={`${strikeSizeClass} text-neutral-500 line-through decoration-red-500/70`}>
            {formatPrice(derivedRegularPrice)}
          </span>
        )}
        <span className={`${priceSizeClass} ${derivedRegularPrice ? 'text-brand-sabz' : 'text-white'}`}>
          {isGiftDisabled ? 'غیرفعال' : formatPrice(giftPrice as number)}
        </span>
      </div>
    );
  }

  if (selectedType === 'code') {
    const isCodeDisabled = codePrice === 'disabled' || !codePrice;
    const derivedRegularPrice = !isCodeDisabled ? getDerivedRegularPrice(codePrice) : null;

    return (
      <div className="flex flex-col gap-1 items-center">
        <span className={`${labelSizeClass} text-neutral-400`}>قیمت تحویل به‌صورت کد مستقیم</span>
        {derivedRegularPrice && (
          <span className={`${strikeSizeClass} text-neutral-500 line-through decoration-red-500/70`}>
            {formatPrice(derivedRegularPrice)}
          </span>
        )}
        <span className={`${priceSizeClass} ${derivedRegularPrice ? 'text-brand-sabz' : 'text-white'}`}>
          {isCodeDisabled ? 'غیرفعال' : formatPrice(codePrice as number)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-center">
      {hasDiscount && (
        <span className={`${strikeSizeClass} text-neutral-500 line-through decoration-red-500/70`}>
          {formatPrice(regularPrice ?? null)}
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className={`${priceSizeClass} text-brand-sabz`}>
          {formatPrice(price)}
        </span>
      </div>
    </div>
  );
};