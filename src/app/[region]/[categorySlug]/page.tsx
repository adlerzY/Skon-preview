import React from "react";
import { getCategoryArchive } from "@/lib/graphql";
import CategoryHero from "@/components/Hero"; 
import ProductGrid from "@/components/ProductGrid"; 
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

interface CategoryPageProps {
  params: Promise<{
    categorySlug: string;
    region: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CategoryArchivePage({ params }: CategoryPageProps) {
  const { categorySlug, region } = await params;
  
  const staticRoutes = ["support", "download", "blog", "cart", "guild-portal"];
  if (staticRoutes.includes(categorySlug.toLowerCase())) {
    notFound();
  }

  const knownRegions = ["eu", "us", "tr"];
  const cookieStore = await cookies();
  const activeRegion = cookieStore.get("store_region")?.value || "eu";

  if (!knownRegions.includes(region.toLowerCase())) {
    redirect(`/${activeRegion}/${region}/${categorySlug}`);
  }

  const categoryData = await getCategoryArchive(categorySlug, region);

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
            : [{ title: name, subtitle: `محصولات و خدمات ${name}` }]
        }
      />
      <ProductGrid title={name} products={categoryProducts} />
    </main>
  );
}