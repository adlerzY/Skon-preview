// src/app/(shop)/[categorySlug]/page.tsx
import React from "react";
import { getCategoryArchive } from "@/lib/graphql";
import CategoryHero from "@/components/Hero"; 
import ProductGrid from "@/components/ProductGrid"; 
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{
    categorySlug: string;
  }>;
  searchParams: Promise<{ // ✅ اضافه شد
    region?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CategoryArchivePage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const { region } = await searchParams; // ✅ استخراج ریجن فعال از متغیرهای URL
  const categoryData = await getCategoryArchive(categorySlug);

  if (!categoryData) {
    notFound();
  }
  const { name, products, banners } = categoryData;
  
  const categoryProducts = products?.nodes || [];

  return (
    <main className="container mx-auto px-6 max-w-[1600px] pb-12">
      
      <CategoryHero 
        banners={
          banners && banners.length > 0 
            ? banners 
            : [{ title: name, subtitle: `محصولات و خدمات بازی ${name}`, imageUrl: "/images/bi-aksi.webp", link: "#" }]
        } 
      />
      <ProductGrid 
        products={categoryProducts} 
        title={`محصولات اختصاصی ${name}`} 
        activeRegion={region} 
      />

    </main>
  );
}