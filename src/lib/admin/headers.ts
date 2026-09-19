import "server-only";

export function getAdminGraphQLHeaders(): Record<string, string> {
  const secret = process.env.BTL_ADMIN_GRAPHQL_SHARED_SECRET?.trim();
  if (!secret) {
    throw new Error("BTL_ADMIN_GRAPHQL_SHARED_SECRET is not configured");
  }

  return {
    "X-BTL-Admin-Request": "1",
    "X-BTL-Admin-Secret": secret,
  };
}
