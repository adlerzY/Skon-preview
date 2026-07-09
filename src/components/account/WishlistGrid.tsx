"use client";

import { useState } from "react";
import ProductCardWishlist from "@/components/ProductCardWishlist";
import { ProductNode } from "@/lib/graphql";

export default function WishlistGrid({ initialProducts, activeRegion }: { initialProducts: ProductNode[]; activeRegion?: string }) {
  const [products, setProducts] = useState(initialProducts);

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
      {products.map((product) => (
        <ProductCardWishlist key={product.id} product={product} activeRegion={activeRegion} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}