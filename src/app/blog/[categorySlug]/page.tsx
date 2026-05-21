// src/app/blog/[categorySlug]/page.tsx
import React from "react";

interface BlogCategoryPageProps {
  params: {
    categorySlug: string;
  };
}

// حتماً باید export default باشد
export default async function BlogCategoryPage({ params }: BlogCategoryPageProps) {
  const { categorySlug } = params;

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-[1600px]">
      <div className="bg-brand-surface p-8 rounded-xl border border-white/5">
        <h1 className="text-2xl font-bold text-brand-blue mb-4">
          صفحه تستی آرشیو دسته‌بندی بلاگ (آرینا تو بتل)
        </h1>
        <p className="text-brand-m_khonsa">
          نامک دسته‌بندی مقالات: <span className="text-white font-mono">{categorySlug}</span>
        </p>
      </div>
    </main>
  );
}