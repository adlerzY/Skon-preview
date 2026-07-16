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
  regularPrice,
  giftPrice,
  codePrice,
  selectedType = 'standard',
  compact = false,
}) => {
  const formatPrice = (value: number | null) => {
    if (value === null || value === 0) return 'رایگان';
    return value.toLocaleString('fa-IR') + ' تومان';
  };

  const hasDiscount = regularPrice && price && regularPrice > price;
  const priceSizeClass = compact ? 'text-sm font-black' : 'text-2xl font-black';
  const labelSizeClass = compact ? 'text-[10px]' : 'text-xs';
  const strikeSizeClass = compact ? 'text-[10px]' : 'text-sm';

  if (selectedType === 'gift') {
    return (
      <div className="flex flex-col gap-1">
        <span className={`${labelSizeClass} text-neutral-400`}>قیمت تحویل به‌صورت گیفت</span>
        <span className={`${priceSizeClass} text-white`}>
          {giftPrice === 'disabled' || !giftPrice ? 'غیرفعال' : formatPrice(giftPrice)}
        </span>
      </div>
    );
  }

  if (selectedType === 'code') {
    return (
      <div className="flex flex-col gap-1">
        <span className={`${labelSizeClass} text-neutral-400`}>قیمت تحویل به‌صورت کد مستقیم</span>
        <span className={`${priceSizeClass} text-white`}>
          {codePrice === 'disabled' || !codePrice ? 'غیرفعال' : formatPrice(codePrice)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-center">
      {hasDiscount && (
        <span className={`${strikeSizeClass} text-neutral-500 line-through decoration-red-500/70`}>
          {formatPrice(regularPrice)}
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