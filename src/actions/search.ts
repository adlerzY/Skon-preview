"use server";

import { cookies } from "next/headers";
import { fetchGraphQL, formatProducts, PRODUCT_CARD_FIELDS } from "@/lib/graphql";

const KNOWN_REGIONS = ["eu", "us", "tr"];

export async function searchProductsByKeyword(keyword: string) {
  const safeKeyword = keyword?.trim();
  if (!safeKeyword) return [];

  try {
    const cookieStore = await cookies();
    const rawRegion = cookieStore.get("store_region")?.value?.toLowerCase();
    const activeRegion = KNOWN_REGIONS.includes(rawRegion ?? "") ? (rawRegion as string) : "eu";

    const data = await fetchGraphQL(
      `
        ${PRODUCT_CARD_FIELDS}
        query SearchProducts($search: String!, $regionSlug: String) {
          products(first: 5, where: { search: $search, status: "PUBLISH", regionSlug: $regionSlug }) {
            nodes {
              ...ProductCardFields
            }
          }
        }
      `,
      { search: safeKeyword, regionSlug: activeRegion },
      [],
      "no-store"
    );

    return formatProducts(data?.products?.nodes || [], true, activeRegion).filter(
      (p) => p.isAvailableInRegion !== false
    );
  } catch (error) {
    console.error("searchProductsByKeyword error:", error);
    return [];
  }
}