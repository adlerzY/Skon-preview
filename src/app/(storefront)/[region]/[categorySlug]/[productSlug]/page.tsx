import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";
import ProductDescriptionSections from "@/components/product/ProductDescriptionSections";
import ProductReviews from "@/components/ProductReviews";

interface ProductPageProps {
  params: Promise<{ region: string; categorySlug: string; productSlug: string }>;
  searchParams: Promise<{ edition?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const { region, productSlug } = await params;
  const { edition } = await searchParams;

  const product = await getProductDetail(productSlug, region);
  if (!product) notFound();

  const { secondaryGallery, description, reviews, reviewCount, averageRating } = product;

  return (
    <main className="container mx-auto px-6 max-w-site py-8">
      <ProductPageClient
        product={{
          ...product,
          secondaryGallery: undefined,
          description: undefined,
          reviews: undefined,
          reviewCount: undefined,
          averageRating: undefined,
        }}
        initialEdition={edition}
        activeRegion={region}
      >
        <ProductDescriptionSections secondaryGallery={secondaryGallery} description={description} />
        <ProductReviews
          productId={product.databaseId}
          reviews={reviews?.nodes}
          pageInfo={reviews?.pageInfo}
          averageRating={averageRating ?? 0}
          reviewCount={reviewCount}
        />
      </ProductPageClient>
    </main>
  );
}