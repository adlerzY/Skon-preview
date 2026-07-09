"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { ProductNode } from "@/lib/graphql";

interface ProductCardWishlistProps {
  product: ProductNode & { activeRegion?: string };
  activeRegion?: string;
  onRemoved?: (productId: number) => void;
}

export default function ProductCardWishlist({ product, activeRegion, onRemoved }: ProductCardWishlistProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [removed, setRemoved] = useState(false);

  const category = product.productCategories?.nodes?.[0];
  const categorySlug = category?.slug || "uncategorized";
  const categoryName = category?.name || "بدون دسته";
  const categoryLogo = category?.image?.sourceUrl;
  const targetRegion = product.activeRegion || activeRegion || "eu";
  const href = `/${targetRegion}/${categorySlug}/${product.slug}`;

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      const res = await fetch("/api/account/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.databaseId }),
      });
      const data = await res.json();
      if (res.ok && data.inWishlist === false) {
        setRemoved(true);
        onRemoved?.(product.databaseId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (removed) return null;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-brand-surface duration-200 hover:bg-brand-surface_hover overflow-hidden relative h-full min-h-[340px]"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#0b0c10] flex-shrink-0">
        {product.image?.sourceUrl ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.name || "تصویر محصول"}
            fill
            className="object-cover transition-all duration-200 ease-in-out brightness-[0.99] group-hover:brightness-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">بدون تصویر</div>
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
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-brand-blue/10 border border-brand-blue text-brand-blue"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} fill="currentColor" />}
            در علاقه‌مندی‌ها
          </button>
        </div>
      </div>
    </Link>
  );
}