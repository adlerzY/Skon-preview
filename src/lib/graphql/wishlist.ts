import "server-only";
import { fetchGraphQL } from "./client";

const WISHLIST_IDS_QUERY = `
  query GetWishlistIds {
    viewer {
      wishlist {
        databaseId
      }
    }
  }
`;

export async function getWishlistProductIds(token?: string | null): Promise<number[]> {
  if (!token) return [];
  const data = await fetchGraphQL(WISHLIST_IDS_QUERY, {}, [], "no-store", token);
  const nodes = data?.viewer?.wishlist ?? [];
  return nodes.map((p: any) => p.databaseId).filter((id: any) => typeof id === "number");
}