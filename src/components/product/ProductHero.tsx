import { Suspense } from "react";
import type { ProductHeroData, ProductPricing } from "@/lib/graphql";
import { ProductMediaProvider } from "./ProductMediaContext";
import ProductGallery from "./ProductGallery";
import PurchaseSection from "./PurchaseSection";
import { PurchaseCardSkeleton } from "./ProductSkeletons";
import { collectImages } from "./imageUtils";
import { MAX_GALLERY_IMAGES, PRODUCT_HERO_ID } from "./productConstants";

export default function ProductHero({
  product,
  region,
  edition,
  pricingPromise,
}: {
  product: ProductHeroData;
  region: string;
  edition?: string;
  pricingPromise: Promise<ProductPricing | null>;
}) {
  const baseImages = collectImages(
    [
      product.imageLarge?.sourceUrl || product.image?.sourceUrl,
      ...(product.galleryImages?.nodes ?? []).map((node) => node.sourceUrl),
    ],
    MAX_GALLERY_IMAGES
  );

  return (
    <ProductMediaProvider key={product.databaseId}>
      <div
        id={PRODUCT_HERO_ID}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 w-full items-stretch"
      >
        <div className="lg:col-span-4 w-full">
          <div className="flex flex-col gap-4 lg:sticky lg:top-[96px]">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-brand-active leading-tight">
                {product.name}
              </h1>
              {product.shortNotify && (
                <div className="mt-2 bg-brand-zard text-brand-menu text-xs px-3 py-2 font-medium">
                  {product.shortNotify}
                </div>
              )}
            </div>

            <Suspense fallback={<PurchaseCardSkeleton />}>
              <PurchaseSection
                product={product}
                region={region}
                edition={edition}
                pricingPromise={pricingPromise}
              />
            </Suspense>

            {product.shortDescription2 && (
              <p className="whitespace-pre-line bg-brand-menu px-4 py-3 text-[13px] leading-6 text-brand-m_khonsa">
                {product.shortDescription2}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 w-full">
          <div className="flex flex-col gap-3 lg:sticky lg:top-[84px]">
            <ProductGallery name={product.name} baseImages={baseImages} />

            {product.shortDescription && (
              <div className="bg-brand-menu px-4 py-3 border border-brand-surface_hover">
                <div
                  className="prose prose-compact max-w-none text-brand-m_khonsa"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProductMediaProvider>
  );
}
