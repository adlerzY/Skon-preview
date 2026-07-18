"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { ProductNode } from "@/lib/graphql";

const formatToPersianDigits = (num: number) => num.toLocaleString("fa-IR");

interface ProductCardProps {
  product: ProductNode & { activeRegion?: string; defaultEdition?: string };
  activeRegion?: string;
  variant?: "price" | "wishlist";
  onRemovedFromWishlist?: (productId: number) => void;
}

function ProductCard({ product, activeRegion, variant = "price", onRemovedFromWishlist }: ProductCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);

  const categoryNodes = product.productCategories?.nodes ?? [];
  const category = categoryNodes[0];
  const categorySlug = category?.slug || "uncategorized";
  const categoryName = category?.name || "بدون دسته";
  const categoryLogo = category?.image?.sourceUrl;
  const subCategories = categoryNodes.slice(1, 4);

  const currentMinPrice = product.parsedPrice;
  const regularMinPrice = product.parsedRegularPrice ? Number(product.parsedRegularPrice) : null;
  const isActualSale = regularMinPrice && currentMinPrice && regularMinPrice > currentMinPrice;

  const badges = [];
  const productDate = product.date ? new Date(product.date).getTime() : 0;
  const now = Date.now();
  const isNew = productDate > 0 && now - productDate < 15 * 24 * 60 * 60 * 1000;

  if (variant === "price") {
    if (isActualSale) badges.push({ text: "حراج", color: "bg-brand-sabz" });
    if (isNew) badges.push({ text: "جدید", color: "bg-brand-blue" });
  }

  const targetRegion = product.activeRegion || activeRegion || "eu";
  const href = `/${targetRegion}/${categorySlug}/${product.slug}`;

  const handleRemoveFromWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);
    try {
      const res = await fetch("/api/account/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.databaseId }),
      });
      const data = await res.json();
      if (res.ok && data.inWishlist === false) {
        setRemoved(true);
        onRemovedFromWishlist?.(product.databaseId);
      }
    } finally {
      setIsRemoving(false);
    }
  };

  if (removed) return null;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-brand-surface duration-200 hover:bg-brand-surface_hover overflow-hidden relative h-full min-h-[380px]"
    >
      {variant === "price" && badges.length > 0 && (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
          {badges.map((badge, index) => (
            <span key={index} className={`${badge.color} text-brand-bg text-[10px] md:text-[13px] font-bold px-3.5 py-1 uppercase tracking-wider`}>
              {badge.text}
            </span>
          ))}
        </div>
      )}

      <div className="relative w-full aspect-[16/10] rounded-none overflow-hidden bg-[#0b0c10] flex-shrink-0">
        {product.image?.sourceUrl ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.name || "تصویر محصول"}
            fill
            className="object-cover transition-all rounded-none duration-200 ease-in-out brightness-[0.99] group-hover:brightness-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">بدون تصویر</div>
        )}
        {variant === "price" && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#23252b] via-transparent to-transparent opacity-20"></div>
        )}
      </div>

      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <div className="transform transition-transform duration-200 ease-out group-hover:-translate-y-1">
          <div className="flex items-center gap-2 mb-1">
            {categoryLogo && (
              <div className="relative w-5 h-5 opacity-90">
                <Image src={categoryLogo} alt={categoryName} fill className="object-contain" sizes="20px" />
              </div>
            )}
            <span className="text-[#8e98b0] text-[12px] font-bold uppercase tracking-wide">{categoryName}</span>
          </div>

          <h3 className="text-[#f3f4f6] font-bold text-base md:text-[17px] transition-colors duration-200 group-hover:text-white line-clamp-2 mb-1">
            {product.name}
          </h3>

          {variant === "price" && (
            <>
              {product.shortDescription && (
                <div
                  className="text-[#ffb400] text-[13px] mb-1 line-clamp-3 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              )}
              {subCategories.length > 0 && (
                <div className="text-[#8e98b0] text-[10px] font-medium leading-relaxed mb-2 line-clamp-1">
                  {subCategories.map((sc) => `[${sc.name}]`).join(" ")}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          {variant === "price" ? (
            <div className="w-full flex flex-col justify-end h-[44px]">
              {currentMinPrice ? (
                <>
                  {isActualSale && (
                    <del className="text-[#8e98b0] text-[12px] opacity-70 line-through self-end mb-0.5">
                      {formatToPersianDigits(regularMinPrice!)}
                    </del>
                  )}

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[#8e98b0] text-[11px] font-medium">شروع قیمت:</span>
                    <span className={`font-bold text-base md:text-[17px] flex items-center gap-1.5 ${isActualSale ? "text-[#75dd04]" : "text-white"}`}>
                      {formatToPersianDigits(currentMinPrice)}
                      <span className={`text-[12px] font-normal ${isActualSale ? "text-white" : "text-[#8e98b0]"}`}>تومان</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-start w-full">
                  <span className="text-[#ff4e4e] font-bold text-sm md:text-base">ناموجود</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRemoveFromWishlist}
              disabled={isRemoving}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-brand-blue/10 border border-brand-blue text-brand-blue"
            >
              {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} fill="currentColor" />}
              در علاقه‌مندی‌ها
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);