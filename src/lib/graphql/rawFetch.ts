import "server-only";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const FALLBACK_LOCAL_URL = "http://tazavesh.local/graphql";

export async function fetchGraphQLWithErrors(
  query: string,
  variables: Record<string, unknown> = {},
  authToken?: string
): Promise<{ data: any; errorMessage: string | null }> {
  try {
    const res = await fetch(WP_GRAPHQL_URL || FALLBACK_LOCAL_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();
    return { data: json?.data ?? null, errorMessage: json?.errors?.[0]?.message ?? null };
  } catch (error) {
    console.error("GraphQL request error:", error);
    return { data: null, errorMessage: null };
  }
}