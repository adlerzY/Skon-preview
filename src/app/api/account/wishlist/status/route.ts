import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWishlistProductIds } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

export async function GET(request: NextRequest) {
  const productId = Number(request.nextUrl.searchParams.get("productId"));
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ inWishlist: false });
  }

  const ids = await getWishlistProductIds(token);
  return NextResponse.json({ inWishlist: ids.includes(productId) });
}