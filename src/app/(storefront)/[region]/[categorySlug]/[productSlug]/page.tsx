import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getProductHero, getProductPricing } from "@/lib/graphql";
import ProductHero from "@/components/product/ProductHero";
import ProductJsonLd from "@/components/product/ProductJsonLd";
import ProductBodySection from "@/components/product/ProductBodySection";
import { ProductBodySkeleton } from "@/components/product/ProductSkeletons";
import ProductReviewsSection from "@/components/ProductReviewsSection";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { makeMetadata, SEO_REGION, stripHtml, selectSeoCategory } from "@/lib/seo/site";

interface ProductPageProps {
  params: Promise<{ region: string; categorySlug: string; productSlug: string }>;
  searchParams: Promise<{ edition?: string | string[] }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { region, categorySlug, productSlug } = await params;
  const product = await getProductHero(productSlug);

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
    description: stripHtml(product.shortDescription) || `خرید ${product.name} از Arena2Battle.`,
    path: region === SEO_REGION ? canonicalPath : undefined,
    image: product.imageLarge?.sourceUrl || product.image?.sourceUrl,
    noIndex: region !== SEO_REGION,
  });
}

export default async function ProductDetailPage({ params, searchParams }: ProductPageProps) {
  const [{ region, categorySlug, productSlug }, { edition: rawEdition }] = await Promise.all([
    params,
    searchParams,
  ]);
  const edition = Array.isArray(rawEdition) ? rawEdition[0] : rawEdition;

  const heroPromise = getProductHero(productSlug);
  const pricingPromise = getProductPricing(productSlug, region);

  const product = await heroPromise;
  if (!product) notFound();

  const primaryCategory = selectSeoCategory(product.productCategories?.nodes);
  if (primaryCategory?.slug && primaryCategory.slug !== categorySlug) {
    permanentRedirect(`/${region}/${primaryCategory.slug}/${product.slug}`);
  }

  const canonicalCategorySlug = primaryCategory?.slug || categorySlug;
  const canonicalPath = `/${region}/${canonicalCategorySlug}/${product.slug}`;
  const categoryName = primaryCategory?.name || canonicalCategorySlug;
  const isSeoRegion = region === SEO_REGION;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-8">
      {isSeoRegion && (
        <>
          <JsonLd
            data={breadcrumbSchema([
              { name: "فروشگاه", url: `/${SEO_REGION}` },
              { name: categoryName, url: `/${SEO_REGION}/${canonicalCategorySlug}` },
              { name: product.name, url: canonicalPath },
            ])}
          />
          <Suspense fallback={null}>
            <ProductJsonLd
              product={product}
              pricingPromise={pricingPromise}
              canonicalPath={canonicalPath}
            />
          </Suspense>
        </>
      )}

      <Breadcrumbs
        items={[
          { label: "فروشگاه", href: `/${region}` },
          { label: categoryName, href: `/${region}/${canonicalCategorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="flex flex-col gap-12 w-full" dir="rtl">
        <ProductHero
          product={product}
          region={region}
          edition={edition}
          pricingPromise={pricingPromise}
        />

        <Suspense fallback={<ProductBodySkeleton />}>
          <ProductBodySection slug={productSlug} />
        </Suspense>

        <div className="cv-auto">
          <ProductReviewsSection
            productId={product.databaseId}
            averageRating={product.averageRating ?? 0}
            reviewCount={product.reviewCount}
          />
        </div>
      </div>
    </main>
  );
}