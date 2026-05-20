"use server"

import { fetchGraphQL, formatProducts, PRODUCT_CARD_FIELDS } from "@/lib/wp-graphql";

export async function searchProductsByKeyword(keyword: string) {
  const safeKeyword = keyword?.trim();
  if (!safeKeyword) return [];

  try {
    const data = await fetchGraphQL(
      `
        ${PRODUCT_CARD_FIELDS}
        query SearchProducts($search: String!) {
          products(first: 5, where: { search: $search, status: "PUBLISH" }) {
            nodes {
              ...ProductCardFields
            }
          }
        }
      `,
      { search: safeKeyword },
      [],
      'no-store'
    );

    return formatProducts(data?.products?.nodes || []);
  } catch (error) {
    return [];
  }
}