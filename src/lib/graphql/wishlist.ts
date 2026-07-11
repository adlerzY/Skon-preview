import "server-only";
import { fetchGraphQL } from "./client";

const WISHLIST_IDS_QUERY = `
  query GetWishlistIds {
    viewer {
      wishlistIds
    }
  }
`;

export async function getWishlistProductIds(token?: string | null): Promise<number[]> {
  if (!token) return [];
  const data = await fetchGraphQL(WISHLIST_IDS_QUERY, {}, [], "no-store", token);
  const ids = data?.viewer?.wishlistIds ?? [];
  return Array.isArray(ids) ? ids.filter((id: any) => typeof id === "number") : [];
}