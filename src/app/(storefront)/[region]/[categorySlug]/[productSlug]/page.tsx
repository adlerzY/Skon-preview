import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import type { ProductNode, VariationCard } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";
import ProductContentMatrix from "@/components/product/ProductContentMatrix";
import ProductDescriptionSections from "@/components/product/ProductDescriptionSections";
import ProductReviewsSection from "@/components/ProductReviewsSection";
import WishlistButtonAsync, { WishlistButtonSkeleton } from "@/components/product/WishlistButtonAsync";

interface ProductPageProps {
  params: Promise<{ region: string; categorySlug: string; productSlug: string }>;
  searchParams: Promise<{ edition?: string }>;
}

function toClientVariations(cards: VariationCard[] | undefined): VariationCard[] {
  if (!cards?.length) return [];

  return cards.map((v) => ({
    databaseId: v.databaseId,
    name: v.name,
    slug: v.slug,
    price: v.price,
    regularPrice: v.regularPrice,
    salePrice: v.salePrice,
    imageUrl: v.imageUrl,
    attributes: v.attributes,
    giftPriceToman: v.giftPriceToman,
    giftRegularPriceToman: v.giftRegularPriceToman,
    codePriceToman: v.codePriceToman,
    codeRegularPriceToman: v.codeRegularPriceToman,
    codeStockCount: v.codeStockCount,
    parsedPrice: v.parsedPrice,
    parsedRegularPrice: v.parsedRegularPrice,
    parsedGiftPrice: v.parsedGiftPrice,
    parsedGiftRegularPrice: v.parsedGiftRegularPrice,
    parsedCodePrice: v.parsedCodePrice,
    parsedCodeRegularPrice: v.parsedCodeRegularPrice,
    regionSlug: v.regionSlug,
    variationIdsByDelivery: v.variationIdsByDelivery,
  }));
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const [{ region, productSlug }, { edition }] = await Promise.all([params, searchParams]);

  const product = await getProductDetail(productSlug, region);

  if (!product) notFound();

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
    <main className="container mx-auto px-6 max-w-site py-8">
      <ProductPageClient
        product={clientProduct}
        initialEdition={edition}
        activeRegion={region}
        wishlistSlot={
          <Suspense fallback={<WishlistButtonSkeleton size={22} />}>
            <WishlistButtonAsync productId={product.databaseId} size={22} />
          </Suspense>
        }
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
    </main>
  );
}