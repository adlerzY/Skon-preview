// src/app/(shop)/[categorySlug]/[productSlug]/page.tsx
import React from "react";

interface ProductPageProps {
  params: {
    categorySlug: string;
    productSlug: string;
  };
}

// حتماً باید export default باشد تا نِکست موقع بیلد ارور ندهد
export default async function ProductPage({ params }: ProductPageProps) {
  const { categorySlug, productSlug } = params;

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-[1600px]">
      <div className="bg-brand-surface p-8 rounded-xl border border-white/5">
        <h1 className="text-2xl font-bold text-brand-blue mb-4">
          صفحه تستی محصول (آرینا تو بتل)
        </h1>
        <p className="text-brand-m_khonsa mb-2">
          نامک دسته‌بندی: <span className="text-white font-mono">{categorySlug}</span>
        </p>
        <p className="text-brand-m_khonsa">
          نامک محصول: <span className="text-white font-mono">{productSlug}</span>
        </p>
      </div>
    </main>
  );
}