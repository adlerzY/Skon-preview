import type { ProductHeroData, ProductNode, ProductPricing } from "@/lib/graphql";
import JsonLd from "@/components/seo/JsonLd";
import { productSchema } from "@/lib/seo/jsonld";

export default async function ProductJsonLd({
  product,
  pricingPromise,
  canonicalPath,
}: {
  product: ProductHeroData;
  pricingPromise: Promise<ProductPricing | null>;
  canonicalPath: string;
}) {
  const pricing = await pricingPromise;

  const enriched = {
    ...product,
    parsedPrice: pricing?.parsedPrice ?? null,
    parsedRegularPrice: pricing?.parsedRegularPrice ?? null,
    isAvailableInRegion: pricing?.isAvailableInRegion,
  } as ProductNode;

  return <JsonLd data={productSchema(enriched, canonicalPath)} />;
}