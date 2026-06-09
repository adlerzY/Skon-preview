import React from "react";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";

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

  return (
    <main className="container mx-auto px-6 py-12 max-w-[1600px]">
      <ProductPageClient 
        product={product} 
        initialEdition={resolvedSearchParams.edition} 
        activeRegion={resolvedSearchParams.region}
      />
    </main>
  );
}