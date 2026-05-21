// src/app/(shop)/[categorySlug]/page.tsx
import React from "react";
import { getCategoryArchive } from "@/lib/wp-graphql";
import CategoryHero from "@/components/Hero"; 
import ProductGrid from "@/components/ProductGrid"; 
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: {
    categorySlug: string;
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryArchivePage({ params }: CategoryPageProps) {
  const { categorySlug } = params;

  const categoryData = await getCategoryArchive(categorySlug);

  if (!categoryData) {
    notFound();
  }

  const { name, products, banners } = categoryData;
  const productList = products?.nodes || [];

  return (
    // اینجا کلاس‌ها دقیقاً مثل صفحه اصلی (page.tsx) ست شده تا لبه‌ها تراز شوند
    <main className="container mx-auto px-6 max-w-[1600px] pb-12">
      
      <CategoryHero 
        banners={
          banners && banners.length > 0 
            ? banners 
            : [{ title: name, subtitle: `محصولات و خدمات بازی ${name}`, imageUrl: "/placeholder-bg.jpg", link: "#" }]
        } 
      />

      {/* دیگر نیازی به دیو کانتینر اضافه دور گرید نیست چون کامپوننت اصلی محدود شده است */}
      <ProductGrid 
        products={productList} 
        title={`محصولات ${name}`} 
      />

    </main>
  );
}