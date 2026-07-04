import "server-only";
import DOMPurify from "isomorphic-dompurify";
import { parsePrice } from "./client";
import { ProductNode, VariationCard } from "./types";

export const sanitizeHtml = (html?: string | null): string | undefined => {
  if (!html) return html ?? undefined;
  return DOMPurify.sanitize(html);
};

export const formatProducts = (
  products: ProductNode[],
  archiveMode: boolean = false,
  activeRegion: string = "eu"
): ProductNode[] => {
  const formattedProducts: ProductNode[] = [];

  products.forEach((product) => {
    const rawVariations = product.variationCards || [];

    const parsedVariationCards = rawVariations.map((v: any) => {
      const pGift = (v.giftPriceToman === "disabled" || !v.giftPriceToman
        ? "disabled"
        : parsePrice(v.giftPriceToman) ?? "disabled") as number | "disabled";

      const pGiftReg = (v.giftRegularPriceToman === "disabled" || !v.giftRegularPriceToman
        ? "disabled"
        : parsePrice(v.giftRegularPriceToman) ?? "disabled") as number | "disabled";

      const pCode = (v.codePriceToman === "disabled" || !v.codePriceToman
        ? "disabled"
        : parsePrice(v.codePriceToman) ?? "disabled") as number | "disabled";

      const pCodeReg = (v.codeRegularPriceToman === "disabled" || !v.codeRegularPriceToman
        ? "disabled"
        : parsePrice(v.codeRegularPriceToman) ?? "disabled") as number | "disabled";

      return {
        ...v,
        parsedPrice: parsePrice(v.price),
        parsedRegularPrice: parsePrice(v.regularPrice),
        parsedGiftPrice: pGift,
        parsedGiftRegularPrice: pGiftReg,
        parsedCodePrice: pCode,
        parsedCodeRegularPrice: pCodeReg,
      };
    });

    let finalPrice: number | null = null;
    let finalRegularPrice: number | null = null;

    if (parsedVariationCards.length > 0) {
      const regionVars = parsedVariationCards.filter(
        (v) => v.regionSlug?.toLowerCase() === activeRegion.toLowerCase()
      );

      const targetVars = regionVars.length > 0 ? regionVars : parsedVariationCards;
      const validPrices = targetVars.filter((v) => typeof v.parsedPrice === "number" && v.parsedPrice > 0);

      if (validPrices.length > 0) {
        const lowestVar = validPrices.reduce((min, p) => (p.parsedPrice! < min.parsedPrice! ? p : min), validPrices[0]);
        finalPrice = lowestVar.parsedPrice;
        finalRegularPrice = lowestVar.parsedRegularPrice;
      } else {
        finalPrice = targetVars[0].parsedPrice;
        finalRegularPrice = targetVars[0].parsedRegularPrice;
      }
    } else {
      finalPrice = parsePrice(product.price);
      finalRegularPrice = parsePrice(product.regularPrice);
    }

    formattedProducts.push({
      ...product,
      shortDescription: sanitizeHtml(product.shortDescription),
      description: sanitizeHtml(product.description),
      parsedPrice: finalPrice,
      parsedRegularPrice: finalRegularPrice,
      variationCards: parsedVariationCards,
      isVariation: parsedVariationCards.length > 0,
    });
  });

  return formattedProducts;
};