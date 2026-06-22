import React from "react";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";
import { cookies } from "next/headers";

interface ProductPageProps {
  params: Promise<{
    categorySlug: string;
    productSlug?: string;
    slug?: string;
  }>;
  searchParams: Promise<{
    edition?: string;
    region?: string;
  }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const currentSlug = resolvedParams.productSlug || resolvedParams.slug;

  if (!currentSlug) {
    notFound();
  }

  const product = await getProductDetail(currentSlug);

  if (!product) {
    notFound();
  }

  const cookieStore = await cookies();
  const activeRegion = resolvedSearchParams.region || cookieStore.get("store_region")?.value || "eu";

  return (
    <main className="container mx-auto px-6 py-5 max-w-site">
      <ProductPageClient 
        product={product} 
        initialEdition={resolvedSearchParams.edition} 
        activeRegion={activeRegion}
      />
    </main>
  );
}