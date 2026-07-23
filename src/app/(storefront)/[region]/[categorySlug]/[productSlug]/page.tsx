import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";

interface ProductPageProps {
  params: Promise<{ region: string; categorySlug: string; productSlug: string }>;
  searchParams: Promise<{ edition?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const { region, productSlug } = await params;
  const { edition } = await searchParams;

  const product = await getProductDetail(productSlug, region);
  if (!product) notFound();

  return (
    <main className="container mx-auto px-6 max-w-site py-8">
      <ProductPageClient product={product} initialEdition={edition} activeRegion={region} />
    </main>
  );
}
