import "server-only";
import DOMPurify from "isomorphic-dompurify";
import { parsePrice } from "./client";
import { ProductNode, VariationCard } from "./types";
import { regionsMatch } from "../regions";

export const sanitizeHtml = (html?: string | null): string | undefined => {
  if (!html) return html ?? undefined;
  return DOMPurify.sanitize(html);
};

type PriceTier = {
  price: number;
  regularPrice: number;
};

interface MinTier {
  price: number | null;
  regularPrice: number | null;
}

interface VariationAccumulator {
  direct: MinTier;
  gift: MinTier;
  code: MinTier;
  hasDirectPrice: boolean;
  hasGiftOrCode: boolean;
}

function createAccumulator(): VariationAccumulator {
  return {
    direct: {
      price: null,
      regularPrice: null,
    },
    gift: {
      price: null,
      regularPrice: null,
    },
    code: {
      price: null,
      regularPrice: null,
    },
    hasDirectPrice: false,
    hasGiftOrCode: false,
  };
}

function updateMinTier(
  tier: MinTier,
  price: unknown,
  regularPrice: unknown
): void {
  if (typeof price !== "number" || price <= 0) {
    return;
  }

  if (tier.price === null || price < tier.price) {
    tier.price = price;
    tier.regularPrice =
      typeof regularPrice === "number" ? regularPrice : price;
  }
}

function selectLowestTier(
  accumulator: VariationAccumulator
): PriceTier | null {
  if (accumulator.direct.price !== null) {
    return {
      price: accumulator.direct.price,
      regularPrice:
        accumulator.direct.regularPrice ?? accumulator.direct.price,
    };
  }

  if (accumulator.gift.price !== null) {
    return {
      price: accumulator.gift.price,
      regularPrice:
        accumulator.gift.regularPrice ?? accumulator.gift.price,
    };
  }

  if (accumulator.code.price !== null) {
    return {
      price: accumulator.code.price,
      regularPrice:
        accumulator.code.regularPrice ?? accumulator.code.price,
    };
  }

  return null;
}

export const formatProducts = (
  products: ProductNode[],
  archiveMode: boolean = false,
  activeRegion: string = "eu"
): ProductNode[] => {
  const formattedProducts: ProductNode[] = [];

  for (const product of products) {
    if (archiveMode && product.archivePricing) {
      const parsedPrice = parsePrice(product.archivePricing.price ?? null);
      const parsedRegularPrice = parsePrice(product.archivePricing.regularPrice ?? null);
      const archiveSafeProduct = { ...product };
      delete archiveSafeProduct.shortDescription;
      delete archiveSafeProduct.description;
      delete archiveSafeProduct.secondaryGallery;
      delete archiveSafeProduct.archivePricing;

      formattedProducts.push({
        ...archiveSafeProduct,
        parsedPrice,
        parsedRegularPrice,
        variationCards: [],
        isVariation: true,
        isAvailableInRegion: product.archivePricing.isAvailableInRegion !== false,
      });
      continue;
    }

    const rawVariations = product.variationCards || [];

    let finalPrice: number | null = null;
    let finalRegularPrice: number | null = null;
    let isAvailableInRegion = true;

    if (rawVariations.length > 0) {
      const parsedVariationCards: VariationCard[] = [];

      const global = createAccumulator();
      const region = createAccumulator();

      let hasRegionAttr = false;
      let regionVariationCount = 0;

      for (const rawVariation of rawVariations) {
        const pGift = (
          rawVariation.giftPriceToman === "disabled" ||
          !rawVariation.giftPriceToman
            ? "disabled"
            : parsePrice(rawVariation.giftPriceToman) ?? "disabled"
        ) as number | "disabled";

        const pGiftReg = (
          rawVariation.giftRegularPriceToman === "disabled" ||
          !rawVariation.giftRegularPriceToman
            ? "disabled"
            : parsePrice(rawVariation.giftRegularPriceToman) ?? "disabled"
        ) as number | "disabled";

        const pCode = (
          rawVariation.codePriceToman === "disabled" ||
          !rawVariation.codePriceToman
            ? "disabled"
            : parsePrice(rawVariation.codePriceToman) ?? "disabled"
        ) as number | "disabled";

        const pCodeReg = (
          rawVariation.codeRegularPriceToman === "disabled" ||
          !rawVariation.codeRegularPriceToman
            ? "disabled"
            : parsePrice(rawVariation.codeRegularPriceToman) ?? "disabled"
        ) as number | "disabled";

        const parsedPrice = parsePrice(rawVariation.price) ?? null;
        const parsedRegularPrice =
          parsePrice(rawVariation.regularPrice) ?? null;

        const parsedVariation = {
          ...rawVariation,
          parsedPrice,
          parsedRegularPrice,
          parsedGiftPrice: pGift,
          parsedGiftRegularPrice: pGiftReg,
          parsedCodePrice: pCode,
          parsedCodeRegularPrice: pCodeReg,
        } as VariationCard;

        parsedVariationCards.push(parsedVariation);

        const hasCodeStock =
          typeof parsedVariation.codeStockCount === "number"
            ? parsedVariation.codeStockCount > 0
            : true;

        const directValid =
          typeof parsedPrice === "number" && parsedPrice > 0;

        const giftValid =
          typeof pGift === "number" && pGift > 0;

        const codeValid =
          typeof pCode === "number" &&
          pCode > 0 &&
          hasCodeStock;

        const anyGiftOrCode =
          typeof pGift === "number" ||
          typeof pCode === "number";

        if (directValid) {
          global.hasDirectPrice = true;

          updateMinTier(
            global.direct,
            parsedPrice,
            parsedRegularPrice
          );
        }

        if (anyGiftOrCode) {
          global.hasGiftOrCode = true;
        }

        if (giftValid) {
          updateMinTier(
            global.gift,
            pGift,
            pGiftReg
          );
        }

        if (codeValid) {
          updateMinTier(
            global.code,
            pCode,
            pCodeReg
          );
        }

        if (parsedVariation.regionSlug) {
          hasRegionAttr = true;
        }

        const matchesActiveRegion = regionsMatch(
          parsedVariation.regionSlug,
          activeRegion
        );

        if (!matchesActiveRegion) {
          continue;
        }

        regionVariationCount++;

        if (directValid) {
          region.hasDirectPrice = true;

          updateMinTier(
            region.direct,
            parsedPrice,
            parsedRegularPrice
          );
        }

        if (anyGiftOrCode) {
          region.hasGiftOrCode = true;
        }

        if (giftValid) {
          updateMinTier(
            region.gift,
            pGift,
            pGiftReg
          );
        }

        if (codeValid) {
          updateMinTier(
            region.code,
            pCode,
            pCodeReg
          );
        }
      }


      const target =
        regionVariationCount > 0
          ? region
          : global;

      const picked = selectLowestTier(target);

      finalPrice = picked?.price ?? null;
      finalRegularPrice = picked?.regularPrice ?? null;

      isAvailableInRegion = hasRegionAttr
        ? regionVariationCount > 0 &&
          (target.hasDirectPrice || target.hasGiftOrCode)
        : target.hasDirectPrice ||
          target.hasGiftOrCode ||
          finalPrice != null;

      const {
        shortDescription,
        description,
        secondaryGallery,
        ...archiveSafeProduct
      } = product;

      formattedProducts.push({
        ...archiveSafeProduct,
        ...(archiveMode
          ? {}
          : {
              shortDescription: sanitizeHtml(shortDescription),
              description: sanitizeHtml(description),
              secondaryGallery: secondaryGallery
                ? secondaryGallery.map((item) => ({
                    ...item,
                    description:
                      sanitizeHtml(item.description) ??
                      item.description,
                  }))
                : secondaryGallery,
            }),
        parsedPrice: finalPrice,
        parsedRegularPrice: finalRegularPrice,
        variationCards: archiveMode ? [] : parsedVariationCards,
        isVariation: parsedVariationCards.length > 0,
        isAvailableInRegion,
      });

      continue;
    }

    finalPrice = parsePrice(product.price) ?? null;
    finalRegularPrice =
      parsePrice(product.regularPrice) ?? null;

    isAvailableInRegion =
      finalPrice != null &&
      finalPrice > 0;

    const {
      shortDescription,
      description,
      secondaryGallery,
      ...archiveSafeProduct
    } = product;

    formattedProducts.push({
      ...archiveSafeProduct,
      ...(archiveMode
        ? {}
        : {
            shortDescription: sanitizeHtml(shortDescription),
            description: sanitizeHtml(description),
            secondaryGallery: secondaryGallery
              ? secondaryGallery.map((item) => ({
                  ...item,
                  description:
                    sanitizeHtml(item.description) ??
                    item.description,
                }))
              : secondaryGallery,
          }),
      parsedPrice: finalPrice,
      parsedRegularPrice: finalRegularPrice,
      variationCards: archiveMode ? [] : rawVariations,
      isVariation: rawVariations.length > 0,
      isAvailableInRegion,
    });
  }

  return formattedProducts;
};