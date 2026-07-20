import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQL } from "@/lib/graphql";
import { resolveAvatarUrl } from "@/lib/avatars";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

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

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`reviews-list:${ip}`, { max: 60, windowMs: 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const productId = Number(request.nextUrl.searchParams.get("productId"));
  const after = request.nextUrl.searchParams.get("after") || undefined;

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
  }

  const data = await fetchGraphQL(
    GET_PRODUCT_REVIEWS_QUERY,
    { id: String(productId), after },
    [],
    "no-store"
  );

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

  return NextResponse.json({
    reviews: nodes,
    pageInfo: connection?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}