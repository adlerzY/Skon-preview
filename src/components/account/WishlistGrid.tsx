"use client";

import { useState } from "react";
import ProductCardWishlist from "@/components/ProductCardWishlist";
import { ProductNode } from "@/lib/graphql";

const CHUNK_SIZE = 10;

export default function WishlistGrid({ initialProducts, activeRegion }: { initialProducts: ProductNode[]; activeRegion?: string }) {
  const [products, setProducts] = useState(initialProducts);
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  const handleRemoved = (productId: number) => {
    setProducts((prev) => prev.filter((p) => p.databaseId !== productId));
  };

  if (products.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-surface_hover p-10 text-center text-brand-m_khonsa">
        هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.
      </div>
    );
  }

  const visibleProducts = products.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-brand-m_khonsa bg-brand-blue/5 border border-brand-blue/20 px-4 py-2.5">
        🔔 در صورت افت قیمت هر یک از این محصولات، از طریق اعلان‌ها به شما اطلاع می‌دهیم.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {visibleProducts.map((product) => (
          <ProductCardWishlist key={product.id} product={product} activeRegion={activeRegion} onRemoved={handleRemoved} />
        ))}
      </div>
      {visibleCount < products.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + CHUNK_SIZE)}
          className="self-center bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors"
        >
          نمایش بیشتر ({(products.length - visibleCount).toLocaleString("fa-IR")} مورد دیگر)
        </button>
      )}
    </div>
  );
}