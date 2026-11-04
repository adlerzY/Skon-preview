import "server-only";
import { unstable_cache } from "next/cache";
import { fetchGraphQL } from "./client";
import { resolveAvatarUrl } from "@/lib/avatars";

const GET_PRODUCT_REVIEWS_QUERY = `
  query GetProductReviews($id: ID!, $after: String) {
    product(id: $id, idType: DATABASE_ID) {
      reviews(first: 20, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          databaseId
          parentDatabaseId
          isStaffReply
          content
          date
          author {
            node {
              name
              ... on User { avatarUrl }
            }
          }
        }
      }
    }
  }
`;

const loadProductReviews = unstable_cache(
  async (productId: number, after: string | null) => {
    const data = await fetchGraphQL(
      GET_PRODUCT_REVIEWS_QUERY,
      { id: String(productId), after: after ?? undefined },
      [],
      "no-store"
    );

    if (data === null) throw new Error("product_reviews_unavailable");

    const connection = data?.product?.reviews;
    const rawNodes = connection?.nodes ?? [];

    const nodes = await Promise.all(
      rawNodes.map(async (r: any) => ({
        ...r,
        author: {
          node: {
            ...r.author?.node,
            avatarUrl: await resolveAvatarUrl(r.author?.node?.avatarUrl),
          },
        },
      }))
    );

    return {
      reviews: nodes,
      pageInfo: connection?.pageInfo ?? { hasNextPage: false, endCursor: null },
    };
  },
  ["product-reviews"],
  { revalidate: 60, tags: ["product-reviews"] }
);

export async function getProductReviews(productId: number, after?: string) {
  try {
    return await loadProductReviews(productId, after ?? null);
  } catch {
    return {
      reviews: [] as any[],
      pageInfo: { hasNextPage: false, endCursor: null as string | null },
    };
  }
}