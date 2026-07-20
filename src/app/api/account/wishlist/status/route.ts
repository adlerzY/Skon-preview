import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWishlistProductIds } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`wishlist-status:${ip}`, { max: 60, windowMs: 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

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