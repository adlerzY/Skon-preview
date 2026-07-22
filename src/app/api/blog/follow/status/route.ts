import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

const QUERY = `
  query GetFollowStatus($id: ID!) {
    category(id: $id, idType: DATABASE_ID) {
      isFollowedByViewer
    }
  }
`;

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  if (!categoryId) {
    return NextResponse.json({ error: "شناسه دسته‌بندی نامعتبر است" }, { status: 400 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ isFollowing: false });

  const data = await fetchGraphQL(QUERY, { id: categoryId }, [], "no-store", token);
  return NextResponse.json({ isFollowing: Boolean(data?.category?.isFollowedByViewer) });
}