// src/app/blog/[categorySlug]/[postSlug]/page.tsx
import React from "react";

interface PostPageProps {
  params: {
    categorySlug: string;
    postSlug: string;
  };
}

// حتماً باید export default باشد تا تایپ‌جنریتور نِکست ارور ندهد
export default async function BlogPostPage({ params }: PostPageProps) {
  const { categorySlug, postSlug } = params;

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-[1600px]">
      <div className="bg-brand-surface p-8 rounded-xl border border-white/5">
        <h1 className="text-2xl font-bold text-brand-blue mb-4">
          صفحه تستی مقاله بلاگ (آرینا تو بتل)
        </h1>
        <p className="text-brand-m_khonsa mb-2">
          دسته‌بندی مقالات: <span className="text-white font-mono">{categorySlug}</span>
        </p>
        <p className="text-brand-m_khonsa">
          نامک یا اسلاگ مقاله: <span className="text-white font-mono">{postSlug}</span>
        </p>
      </div>
    </main>
  );
}