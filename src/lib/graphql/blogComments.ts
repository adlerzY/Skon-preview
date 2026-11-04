import "server-only";
import { unstable_cache } from "next/cache";
import { fetchGraphQL } from "./client";
import { POST_COMMENTS_QUERY } from "./blog";
import { resolveAvatarUrl } from "@/lib/avatars";

const loadPostComments = unstable_cache(
  async (postId: string, after: string | null) => {
    const data = await fetchGraphQL(
      POST_COMMENTS_QUERY,
      { id: postId, after: after ?? undefined },
      [],
      "no-store"
    );

    if (data === null) throw new Error("post_comments_unavailable");

    const connection = data?.post?.comments;
    const rawNodes = connection?.nodes ?? [];

    const nodes = await Promise.all(
      rawNodes.map(async (c: any) => ({
        ...c,
        author: {
          node: {
            ...c.author?.node,
            avatarUrl: await resolveAvatarUrl(c.author?.node?.avatarUrl),
          },
        },
      }))
    );

    return {
      comments: nodes,
      pageInfo: connection?.pageInfo ?? { hasNextPage: false, endCursor: null },
    };
  },
  ["post-comments"],
  { revalidate: 60, tags: ["post-comments"] }
);

export async function getPostComments(postId: string | number, after?: string) {
  try {
    return await loadPostComments(String(postId), after ?? null);
  } catch {
    return {
      comments: [] as any[],
      pageInfo: { hasNextPage: false, endCursor: null as string | null },
    };
  }
}