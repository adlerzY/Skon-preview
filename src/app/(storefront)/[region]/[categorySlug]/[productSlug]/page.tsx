import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import type { ProductNode, VariationCard } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";
import ProductContentMatrix from "@/components/product/ProductContentMatrix";
import ProductDescriptionSections from "@/components/product/ProductDescriptionSections";
import ProductReviewsSection from "@/components/ProductReviewsSection";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, productSchema } from "@/lib/seo/jsonld";
import { makeMetadata, SEO_REGION, stripHtml, selectSeoCategory } from "@/lib/seo/site";

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

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { region, categorySlug, productSlug } = await params;
  const product = await getProductDetail(productSlug, SEO_REGION);

  if (!product) {
    return {
      title: "محصول پیدا نشد",
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  const primaryCategory = selectSeoCategory(product.productCategories?.nodes);
  const canonicalCategory = primaryCategory?.slug || categorySlug;
  const canonicalPath = `/${SEO_REGION}/${canonicalCategory}/${product.slug}`;

  return makeMetadata({
    title: product.name,
    description: stripHtml(product.shortDescription || product.description || `خرید ${product.name} از Arena2Battle.`),
    path: region === SEO_REGION ? canonicalPath : undefined,
    image: product.imageLarge?.sourceUrl || product.image?.sourceUrl,
    noIndex: region !== SEO_REGION,
  });
}

async function ProductDetailStream({
  productPromise,
  initialEdition,
  region,
  requestedCategorySlug,
}: {
  productPromise: Promise<ProductNode | null>;
  initialEdition?: string;
  region: string;
  requestedCategorySlug: string;
}) {
  const product = await productPromise;

  if (!product) {
    notFound();
    return null;
  }

  const primaryCategory = selectSeoCategory(product.productCategories?.nodes);
  if (primaryCategory?.slug && primaryCategory.slug !== requestedCategorySlug) {
    permanentRedirect(`/${region}/${primaryCategory.slug}/${product.slug}`);
  }

  const { secondaryGallery, description, reviewCount, averageRating, contentMatrix } = product;
  const canonicalCategorySlug = primaryCategory?.slug || requestedCategorySlug;
  const canonicalPath = `/${region}/${canonicalCategorySlug}/${product.slug}`;
  const isSeoRegion = region === SEO_REGION;
  const categoryName = primaryCategory?.name || canonicalCategorySlug;

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
      {isSeoRegion && (
        <JsonLd
          data={[
            productSchema(product, canonicalPath),
            breadcrumbSchema([
              { name: "فروشگاه", url: `/${SEO_REGION}` },
              { name: categoryName, url: `/${SEO_REGION}/${canonicalCategorySlug}` },
              { name: product.name, url: canonicalPath },
            ]),
          ]}
        />
      )}
      <Breadcrumbs
        items={[
          { label: "فروشگاه", href: `/${region}` },
          { label: categoryName, href: `/${region}/${canonicalCategorySlug}` },
          { label: product.name },
        ]}
      />
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
  const [{ region, categorySlug, productSlug }, { edition }] = await Promise.all([params, searchParams]);
  const productPromise = getProductDetail(productSlug, region);
  return (
    <main className="container mx-auto px-6 max-w-site py-8">
      <ProductDetailStream
        productPromise={productPromise}
        initialEdition={edition}
        region={region}
        requestedCategorySlug={categorySlug}
      />
    </main>
  );
}
