import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import type { ProductNode, VariationCard } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";
import ProductContentMatrix from "@/components/product/ProductContentMatrix";
import ProductDescriptionSections from "@/components/product/ProductDescriptionSections";
import ProductReviewsSection from "@/components/ProductReviewsSection";
import ProductPageShell from "@/components/product/ProductPageShell";

interface ProductPageProps {
  params: Promise<{ region: string; categorySlug: string; productSlug: string }>;
  searchParams: Promise<{ edition?: string }>;
}

function toClientVariations(cards: VariationCard[] | undefined): VariationCard[] {
  if (!cards?.length) return [];

  return cards.map((v) => ({
    databaseId: v.databaseId,
    imageUrl: v.imageUrl,
    attributes: v.attributes,
    codeStockCount: v.codeStockCount,
    parsedPrice: v.parsedPrice,
    parsedRegularPrice: v.parsedRegularPrice,
    parsedGiftPrice: v.parsedGiftPrice,
    parsedGiftRegularPrice: v.parsedGiftRegularPrice,
    parsedCodePrice: v.parsedCodePrice,
    parsedCodeRegularPrice: v.parsedCodeRegularPrice,
    regionSlug: v.regionSlug,
    commissionDiscountBadge: v.commissionDiscountBadge,
    variationIdsByDelivery: v.variationIdsByDelivery,
  } as VariationCard));
}

async function ProductDetailStream({
  productPromise,
  initialEdition,
  region,
}: {
  productPromise: Promise<ProductNode | null>;
  initialEdition?: string;
  region: string;
}) {
  const product = await productPromise;

  if (!product) {
    notFound();
    return null;
  }

  const { secondaryGallery, description, reviewCount, averageRating, contentMatrix } = product;

  const clientProduct = {
    id: product.id,
    databaseId: product.databaseId,
    name: product.name,
    slug: product.slug,
    shortNotify: product.shortNotify,
    shortDescription: product.shortDescription,
    image: product.image,
    imageLarge: product.imageLarge,
    galleryImages: product.galleryImages,
    parsedPrice: product.parsedPrice,
    parsedRegularPrice: product.parsedRegularPrice,
    isVariation: product.isVariation,
    variationCards: toClientVariations(product.variationCards),
  } as ProductNode;

  return (
    <>
      <ProductPageClient
        product={clientProduct}
        initialEdition={initialEdition}
        activeRegion={region}
      >
        <div className="cv-auto">
          <ProductContentMatrix contentMatrix={contentMatrix} />
        </div>
        <div className="cv-auto">
          <ProductDescriptionSections secondaryGallery={secondaryGallery} description={description} />
        </div>
        <div className="cv-auto">
          <ProductReviewsSection
            productId={product.databaseId}
            averageRating={averageRating ?? 0}
            reviewCount={reviewCount}
          />
        </div>
      </ProductPageClient>
    </>
  );
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const [{ region, productSlug }, { edition }] = await Promise.all([params, searchParams]);
  const productPromise = getProductDetail(productSlug, region);

  return (
    <main className="container mx-auto px-6 max-w-site py-8">
      <Suspense fallback={<ProductPageShell />}>
        <ProductDetailStream
          productPromise={productPromise}
          initialEdition={edition}
          region={region}
        />
      </Suspense>
    </main>
  );
}
