import type { ProductHeroData, ProductPricing, VariationCard } from "@/lib/graphql";
import PurchasePanel from "./PurchasePanel";
import PurchaseUnavailable from "./PurchaseUnavailable";

function toClientVariations(cards: VariationCard[]): VariationCard[] {
  return cards.map(
    (variation) =>
      ({
        databaseId: variation.databaseId,
        imageUrl: variation.imageUrl,
        attributes: variation.attributes,
        codeStockCount: variation.codeStockCount,
        parsedPrice: variation.parsedPrice,
        parsedRegularPrice: variation.parsedRegularPrice,
        parsedGiftPrice: variation.parsedGiftPrice,
        parsedGiftRegularPrice: variation.parsedGiftRegularPrice,
        parsedCodePrice: variation.parsedCodePrice,
        parsedCodeRegularPrice: variation.parsedCodeRegularPrice,
        regionSlug: variation.regionSlug,
        commissionDiscountBadge: variation.commissionDiscountBadge,
        variationIdsByDelivery: variation.variationIdsByDelivery,
      }) as VariationCard
  );
}

export default async function PurchaseSection({
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
  const pricing = await pricingPromise;

  if (!pricing) return <PurchaseUnavailable />;

  return (
    <PurchasePanel
      key={`${product.databaseId}:${region}:${edition ?? ""}`}
      productId={product.databaseId}
      productName={product.name}
      productSlug={product.slug}
      region={region}
      initialEdition={edition}
      variations={toClientVariations(pricing.variationCards)}
      fallbackPrice={pricing.parsedPrice}
      fallbackRegularPrice={pricing.parsedRegularPrice}
      fallbackImage={product.image?.sourceUrl ?? null}
    />
  );
}