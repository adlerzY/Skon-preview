import type { VariationCard } from "@/lib/graphql";
import {
  findMatchingVariations,
  hasStock,
  matchesRegion,
  type GroupedAttribute,
  type RegionInfo,
} from "./variationMatcher";

export interface SimpleProductFallback {
  databaseId: number;
  name: string;
  slug: string;
  price: number | null;
  regularPrice: number | null;
  imageUrl: string | null;
}

export function aggregateVariation(
  variations: VariationCard[],
  groupedAttributes: GroupedAttribute[],
  selectedAttrs: Record<string, string>,
  regionInfo: RegionInfo | null,
  fallback: SimpleProductFallback
): VariationCard | null {
  if (variations.length === 0) {
    if (fallback.price == null) return null;
    const regular = fallback.regularPrice ?? fallback.price;

    return {
      databaseId: fallback.databaseId,
      name: fallback.name,
      slug: fallback.slug,
      price: String(fallback.price),
      regularPrice: String(regular),
      salePrice: "",
      imageUrl: fallback.imageUrl ?? "",
      attributes: [],
      giftPrice: "disabled",
      codePrice: "disabled",
      parsedPrice: fallback.price,
      parsedRegularPrice: regular,
      parsedGiftPrice: "disabled",
      parsedGiftRegularPrice: "disabled",
      parsedCodePrice: "disabled",
      parsedCodeRegularPrice: "disabled",
    };
  }

  const candidates = findMatchingVariations(variations, groupedAttributes, selectedAttrs, regionInfo);
  if (candidates.length === 0) return null;

  let accPrice: number | null = null;
  let accRegularPrice: number | null = null;
  let accGift: number | "disabled" = "disabled";
  let accGiftRegular: number | "disabled" = "disabled";
  let accCode: number | "disabled" = "disabled";
  let accCodeRegular: number | "disabled" = "disabled";
  let accCodeStock: number | undefined = undefined;
  const variationIdsByDelivery: { direct?: number; gift?: number; code?: number } = {};

  for (const candidate of candidates) {
    if (candidate.parsedPrice != null && (accPrice === null || candidate.parsedPrice < accPrice)) {
      accPrice = candidate.parsedPrice;
      accRegularPrice = candidate.parsedRegularPrice ?? candidate.parsedPrice;
      variationIdsByDelivery.direct = candidate.databaseId;
    }

    if (
      typeof candidate.parsedGiftPrice === "number" &&
      (accGift === "disabled" || candidate.parsedGiftPrice < (accGift as number))
    ) {
      accGift = candidate.parsedGiftPrice;
      accGiftRegular =
        typeof candidate.parsedGiftRegularPrice === "number"
          ? candidate.parsedGiftRegularPrice
          : candidate.parsedGiftPrice;
      variationIdsByDelivery.gift = candidate.databaseId;
    }

    if (typeof candidate.parsedCodePrice === "number") {
      const currentViable = typeof accCodeStock === "number" && accCodeStock > 0;
      const candidateViable = typeof candidate.codeStockCount === "number" && candidate.codeStockCount > 0;
      const shouldReplace =
        accCode === "disabled" ||
        (candidateViable && !currentViable) ||
        (candidateViable === currentViable && candidate.parsedCodePrice < (accCode as number));

      if (shouldReplace) {
        accCode = candidate.parsedCodePrice;
        accCodeRegular =
          typeof candidate.parsedCodeRegularPrice === "number"
            ? candidate.parsedCodeRegularPrice
            : candidate.parsedCodePrice;
        accCodeStock = candidate.codeStockCount;
        variationIdsByDelivery.code = candidate.databaseId;
      }
    }

    const comboText = candidate.attributes?.map((attr) => attr.value.toLowerCase()).join(" ") ?? "";

    if (
      (comboText.includes("گیفت") || comboText.includes("gift")) &&
      candidate.parsedPrice != null &&
      accGift === "disabled"
    ) {
      accGift = candidate.parsedPrice;
      accGiftRegular = candidate.parsedRegularPrice ?? candidate.parsedPrice;
      variationIdsByDelivery.gift = candidate.databaseId;
    }

    if ((comboText.includes("کد") || comboText.includes("code")) && candidate.parsedPrice != null) {
      const currentViable = typeof accCodeStock === "number" && accCodeStock > 0;
      const candidateViable = typeof candidate.codeStockCount === "number" && candidate.codeStockCount > 0;
      const shouldReplace =
        accCode === "disabled" ||
        (candidateViable && !currentViable) ||
        (candidateViable === currentViable && candidate.parsedPrice < (accCode as number));

      if (shouldReplace) {
        accCode = candidate.parsedPrice;
        accCodeRegular = candidate.parsedRegularPrice ?? candidate.parsedPrice;
        accCodeStock = candidate.codeStockCount;
        variationIdsByDelivery.code = candidate.databaseId;
      }
    }
  }

  return {
    ...candidates[0],
    parsedPrice: accPrice,
    parsedRegularPrice: accRegularPrice,
    parsedGiftPrice: accGift,
    parsedGiftRegularPrice: accGiftRegular,
    parsedCodePrice: accCode,
    parsedCodeRegularPrice: accCodeRegular,
    codeStockCount: accCodeStock,
    variationIdsByDelivery,
  };
}

export function resolveNextSelection(
  variations: VariationCard[],
  groupedAttributes: GroupedAttribute[],
  regionInfo: RegionInfo | null,
  previous: Record<string, string>,
  name: string,
  value: string
): { attrs: Record<string, string>; changedIndex: number } {
  const draft = { ...previous, [name]: value };
  if (regionInfo) draft[regionInfo.name] = regionInfo.value;

  const changedIndex = groupedAttributes.findIndex((group) => group.name === name);

  for (let i = changedIndex + 1; i < groupedAttributes.length; i += 1) {
    const nextGroup = groupedAttributes[i];

    const stillValid = variations.some(
      (variation) =>
        groupedAttributes
          .slice(0, i + 1)
          .every((group) =>
            variation.attributes?.some(
              (attr) => attr.name === group.name && attr.value === draft[group.name]
            )
          ) &&
        matchesRegion(variation, regionInfo) &&
        hasStock(variation)
    );

    if (stillValid) continue;

    const fallback = nextGroup.values.find((candidate) =>
      variations.some(
        (variation) =>
          groupedAttributes
            .slice(0, i)
            .every((group) =>
              variation.attributes?.some(
                (attr) => attr.name === group.name && attr.value === draft[group.name]
              )
            ) &&
          variation.attributes?.some(
            (attr) => attr.name === nextGroup.name && attr.value === candidate.value
          ) &&
          matchesRegion(variation, regionInfo) &&
          hasStock(variation)
      )
    );

    draft[nextGroup.name] = fallback?.value ?? nextGroup.values[0]?.value ?? "";
  }

  return { attrs: draft, changedIndex };
}