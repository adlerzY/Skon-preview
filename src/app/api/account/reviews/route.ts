import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { MY_REVIEWS_QUERY } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const after = request.nextUrl.searchParams.get("after") || undefined;
  const data = await fetchGraphQL(MY_REVIEWS_QUERY, { after }, [], "no-store", token);

  return NextResponse.json({
    reviews: data?.myReviews?.nodes ?? [],
    pageInfo: data?.myReviews?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}