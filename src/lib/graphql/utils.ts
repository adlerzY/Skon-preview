import "server-only";
import DOMPurify from "isomorphic-dompurify";
import { parsePrice } from "./client";
import { ProductNode, VariationCard } from "./types";

export const sanitizeHtml = (html?: string | null): string | undefined => {
  if (!html) return html ?? undefined;
  return DOMPurify.sanitize(html);
};

const REGION_ALIASES: Record<string, string[]> = {
  eu: ["eu", "eu-global", "اروپا", "europe"],
  us: ["us", "امریکا", "آمریکا", "america", "usa"],
  tr: ["tr", "ترکیه", "turkey"],
};

function normalizeRegionToken(token?: string | null): string {
  if (!token) return "";
  const lower = token.trim().toLowerCase();
  for (const [canon, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((alias) => lower === alias || lower.includes(alias))) return canon;
  }
  return lower;
}

export function regionsMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizeRegionToken(a) === normalizeRegionToken(b);
}

type PriceTier = { price: number; regularPrice: number };

function pickLowest(
  vars: any[],
  priceKey: "parsedPrice" | "parsedGiftPrice" | "parsedCodePrice",
  regularKey: "parsedRegularPrice" | "parsedGiftRegularPrice" | "parsedCodeRegularPrice"
): PriceTier | null {
  const valid = vars.filter((v) => {
    const p = v[priceKey];
    if (typeof p !== "number" || p <= 0) return false;
    if (priceKey === "parsedCodePrice" && typeof v.codeStockCount === "number" && v.codeStockCount <= 0) return false;
    return true;
  });
  if (valid.length === 0) return null;
  const lowest = valid.reduce((min, v) => (v[priceKey] < min[priceKey] ? v : min));
  const reg = lowest[regularKey];
  return { price: lowest[priceKey], regularPrice: typeof reg === "number" ? reg : lowest[priceKey] };
}

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
    let isAvailableInRegion = true;

    if (parsedVariationCards.length > 0) {
      const hasRegionAttr = parsedVariationCards.some((v) => !!v.regionSlug);
      const regionVars = parsedVariationCards.filter((v) => regionsMatch(v.regionSlug, activeRegion));
      const targetVars = regionVars.length > 0 ? regionVars : parsedVariationCards;

      const picked =
        pickLowest(targetVars, "parsedPrice", "parsedRegularPrice") ??
        pickLowest(targetVars, "parsedGiftPrice", "parsedGiftRegularPrice") ??
        pickLowest(targetVars, "parsedCodePrice", "parsedCodeRegularPrice");

      finalPrice = picked?.price ?? null;
      finalRegularPrice = picked?.regularPrice ?? null;

      const hasDirectPrice = targetVars.some((v) => typeof v.parsedPrice === "number" && v.parsedPrice > 0);
      const hasGiftOrCode = targetVars.some(
        (v) => typeof v.parsedGiftPrice === "number" || typeof v.parsedCodePrice === "number"
      );

      isAvailableInRegion = hasRegionAttr
        ? regionVars.length > 0 && (hasDirectPrice || hasGiftOrCode)
        : hasDirectPrice || hasGiftOrCode || finalPrice != null;
    } else {
      finalPrice = parsePrice(product.price);
      finalRegularPrice = parsePrice(product.regularPrice);
      isAvailableInRegion = finalPrice != null && finalPrice > 0;
    }

    formattedProducts.push({
      ...product,
      shortDescription: sanitizeHtml(product.shortDescription),
      description: sanitizeHtml(product.description),
      parsedPrice: finalPrice,
      parsedRegularPrice: finalRegularPrice,
      variationCards: parsedVariationCards,
      isVariation: parsedVariationCards.length > 0,
      isAvailableInRegion,
    });
  });

  return formattedProducts;
};