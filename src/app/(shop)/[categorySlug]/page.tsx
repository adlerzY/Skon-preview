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

  // ۱. گرفتن دیتای اختصاصی این دسته‌بندی از وردپرس
  const categoryData = await getCategoryArchive(categorySlug);

  if (!categoryData) {
    notFound();
  }

  // ۲. استخراج نام دسته‌بندی، بنرها و محصولاتِ فیلترشده‌ی همین دسته‌بندی
  const { name, products, banners } = categoryData;
  
  // مطمئن شو که این لیست دقیقاً nodes مربوط به همین رفرنس هست
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

      {/* پاس دادن محصولاتِ فیلتر شده‌ی همین بازی */}
      <ProductGrid 
        products={categoryProducts} 
        title={`محصولات اختصاصی ${name}`} 
      />

    </main>
  );
}