import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";

interface ProductPageProps {
  params: Promise<{ categorySlug: string; productSlug?: string; slug?: string; region: string }>;
  searchParams: Promise<{ edition?: string }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentSlug = resolvedParams.productSlug || resolvedParams.slug;
  if (!currentSlug) notFound();

  const product = await getProductDetail(currentSlug, resolvedParams.region);
  if (!product) notFound();

  return (
    <main className="container mx-auto px-6 py-5 max-w-site">
      <ProductPageClient
        product={product}
        initialEdition={resolvedSearchParams.edition}
        activeRegion={resolvedParams.region}
      />
    </main>
  );
}