import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { fetchGraphQL } from "./client";
import { formatProducts, sanitizeHtml } from "./utils";
import type { ContentMatrix, ProductNode, VariationCard } from "./types";

const MAX_TAG_LENGTH = 256;
const PRICING_TTL_SECONDS = 120;

export type ProductHeroData = Pick<
  ProductNode,
  | "id"
  | "databaseId"
  | "name"
  | "slug"
  | "featured"
  | "date"
  | "shortDescription"
  | "shortNotify"
  | "image"
  | "imageLarge"
  | "galleryImages"
  | "productCategories"
  | "averageRating"
  | "reviewCount"
>;

export interface ProductPricing {
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  parsedPrice: number | null;
  parsedRegularPrice: number | null;
  variationCards: VariationCard[];
  isVariation: boolean;
  isAvailableInRegion: boolean;
}

export interface ProductBodyData {
  description?: string;
  secondaryGallery?: Array<{ description: string; imageUrl: string }> | null;
  contentMatrix?: ContentMatrix | null;
}

const PRODUCT_HERO_QUERY = `
  query GetProductHero($id: ID!) {
    product(id: $id, idType: SLUG) {
      id
      databaseId
      name
      slug
      featured
      date
      shortDescription
      shortNotify
      image { sourceUrl(size: MEDIUM) }
      imageLarge: image { sourceUrl(size: LARGE) }
      galleryImages { nodes { sourceUrl(size: LARGE) } }
      productCategories(first: 10) { nodes { name slug } }
      averageRating
      reviewCount
    }
  }
`;

const PRODUCT_PRICING_QUERY = `
  query GetProductDetailPricing($id: ID!) {
    product(id: $id, idType: SLUG) {
      databaseId

      ... on SimpleProduct {
        price
        regularPrice
        salePrice
      }

      ... on VariableProduct {
        price
        regularPrice
        salePrice

        variationCards {
          databaseId
          name
          slug
          price
          regularPrice
          salePrice
          imageUrl
          regionSlug

          giftPrice
          giftRegularPrice

          codePrice
          codeRegularPrice
          codeStockCount

          attributes {
            name
            taxonomy
            value
            slug
            flagUrl
          }
        }
      }
    }
  }
`;

const PRODUCT_BODY_QUERY = `
  query GetProductBody($id: ID!) {
    product(id: $id, idType: SLUG) {
      databaseId
      description
      secondaryGallery { description imageUrl }
      contentMatrix {
        columns { key label }
        items { name includedIn }
        image
      }
    }
  }
`;

function buildSlugTag(prefix: string, slug: string): string {
  let normalized = slug;
  try {
    normalized = decodeURIComponent(slug);
  } catch {
    normalized = slug;
  }

  const asciiPart = normalized
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const hash = crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 16);

  return asciiPart ? `${prefix}-${asciiPart}-${hash}` : `${prefix}-${hash}`;
}

function pricingTags(slug: string): string[] {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }

  const encoded = encodeURIComponent(decoded);
  const lowerHex = encoded.replace(/%[0-9A-F]{2}/g, (match) => match.toLowerCase());

  const tags = [
    ...[slug, decoded, encoded, lowerHex].map((value) => `product-pricing-${value}`),
    buildSlugTag("product-pricing", slug),
  ];

  return Array.from(new Set(tags)).filter((tag) => tag.length <= MAX_TAG_LENGTH);
}

async function loadHero(slug: string): Promise<ProductHeroData | null> {
  const run = unstable_cache(
    async (): Promise<ProductHeroData | null> => {
      const data = await fetchGraphQL(PRODUCT_HERO_QUERY, { id: slug }, [`product-${slug}`]);

      if (data === null) {
        throw new Error(`دریافت اطلاعات محصول «${slug}» با خطا مواجه شد`);
      }

      const product = data.product;
      if (!product) return null;

      return {
        ...product,
        shortDescription: sanitizeHtml(product.shortDescription),
      } as ProductHeroData;
    },
    ["product-hero", slug],
    { tags: [`product-${slug}`], revalidate: false }
  );

  return run();
}

async function loadPricing(slug: string, region: string): Promise<ProductPricing | null> {
  const run = unstable_cache(
    async (): Promise<ProductPricing | null> => {
      const data = await fetchGraphQL(PRODUCT_PRICING_QUERY, { id: slug }, [], "no-store");

      if (data === null) {
        throw new Error(`دریافت قیمت محصول «${slug}» با خطا مواجه شد`);
      }

      if (!data.product) return null;

      const formatted = formatProducts([data.product], false, region)[0];
      if (!formatted) return null;

      return {
        price: formatted.price,
        regularPrice: formatted.regularPrice,
        salePrice: formatted.salePrice,
        parsedPrice: formatted.parsedPrice ?? null,
        parsedRegularPrice: formatted.parsedRegularPrice ?? null,
        variationCards: formatted.variationCards ?? [],
        isVariation: Boolean(formatted.isVariation),
        isAvailableInRegion: formatted.isAvailableInRegion !== false,
      };
    },
    ["product-detail-pricing", slug, region],
    { tags: pricingTags(slug), revalidate: PRICING_TTL_SECONDS }
  );

  return run();
}

async function loadBody(slug: string): Promise<ProductBodyData | null> {
  const run = unstable_cache(
    async (): Promise<ProductBodyData | null> => {
      const data = await fetchGraphQL(PRODUCT_BODY_QUERY, { id: slug }, [`product-${slug}`]);

      if (data === null) {
        throw new Error(`دریافت توضیحات محصول «${slug}» با خطا مواجه شد`);
      }

      const product = data.product;
      if (!product) return null;

      return {
        description: sanitizeHtml(product.description),
        secondaryGallery: product.secondaryGallery
          ? product.secondaryGallery.map((item: { description?: string; imageUrl?: string }) => ({
              ...item,
              description: sanitizeHtml(item.description) ?? item.description,
            }))
          : product.secondaryGallery,
        contentMatrix: product.contentMatrix ?? null,
      };
    },
    ["product-body", slug],
    { tags: [`product-${slug}`], revalidate: false }
  );

  return run();
}

export const getProductHero = cache(async (slug: string): Promise<ProductHeroData | null> => {
  if (!slug) return null;
  return loadHero(slug);
});

export const getProductPricing = cache(
  async (slug: string, region: string): Promise<ProductPricing | null> => {
    if (!slug) return null;
    try {
      return await loadPricing(slug, region);
    } catch (error) {
      console.error("getProductPricing failed:", error);
      return null;
    }
  }
);

export const getProductBody = cache(async (slug: string): Promise<ProductBodyData | null> => {
  if (!slug) return null;
  try {
    return await loadBody(slug);
  } catch (error) {
    console.error("getProductBody failed:", error);
    return null;
  }
});