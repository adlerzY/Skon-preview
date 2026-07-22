import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

const QUERY = `
  query GetMyRating($id: ID!) {
    post(id: $id, idType: DATABASE_ID) {
      myRating
      averageRating
      ratingCount
    }
  }
`;

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "شناسه پست نامعتبر است" }, { status: 400 });

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ myRating: null });

  const data = await fetchGraphQL(QUERY, { id: postId }, [], "no-store", token);
  return NextResponse.json({
    myRating: data?.post?.myRating ?? null,
    averageRating: data?.post?.averageRating ?? null,
    ratingCount: data?.post?.ratingCount ?? null,
  });
}