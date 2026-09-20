"use server";

import { fetchGraphQL, formatProducts, PRODUCT_CARD_FIELDS } from "@/lib/graphql";
import { DEFAULT_REGION, KNOWN_REGIONS } from "@/lib/regions";
import type { ProductNode } from "@/lib/graphql/types";

export interface SearchProductsResult {
  products: ProductNode[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

function resolveRegion(region: string): string {
  const normalized = region.trim().toLowerCase();
  return KNOWN_REGIONS.includes(normalized) ? normalized : DEFAULT_REGION;
}

export async function searchProductsByKeyword(
  keyword: string,
  region: string,
  options: { after?: string; before?: string; first?: number; last?: number } = {},
): Promise<SearchProductsResult> {
  const safeKeyword = keyword?.trim();
  const activeRegion = resolveRegion(region);
  if (!safeKeyword) {
    return {
      products: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    };
  }

  const first = options.before ? null : Math.min(Math.max(Number(options.first) || 24, 1), 48);
  const last = options.before ? Math.min(Math.max(Number(options.last) || 24, 1), 48) : null;
  const after = options.before ? null : options.after || null;
  const before = options.before || null;

  try {
    const data = await fetchGraphQL(
      `
        ${PRODUCT_CARD_FIELDS}
        query SearchProducts(
          $search: String!
          $regionSlug: String
          $first: Int
          $after: String
          $last: Int
          $before: String
        ) {
          products(
            first: $first
            after: $after
            last: $last
            before: $before
            where: { search: $search, status: "PUBLISH", regionSlug: $regionSlug }
          ) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            nodes {
              ...ProductCardFields
            }
          }
        }
      `,
      {
        search: safeKeyword,
        regionSlug: activeRegion,
        first,
        after,
        last,
        before,
      },
      [],
      "no-store",
    );

    const products = formatProducts(data?.products?.nodes || [], true, activeRegion).filter(
      (p) => p.isAvailableInRegion !== false,
    );
    const pageInfo = data?.products?.pageInfo || {};

    return {
      products,
      pageInfo: {
        hasNextPage: Boolean(pageInfo.hasNextPage),
        hasPreviousPage: Boolean(pageInfo.hasPreviousPage),
        startCursor: typeof pageInfo.startCursor === "string" ? pageInfo.startCursor : null,
        endCursor: typeof pageInfo.endCursor === "string" ? pageInfo.endCursor : null,
      },
    };
  } catch (error) {
    console.error("searchProductsByKeyword error:", error);
    return {
      products: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    };
  }
}
