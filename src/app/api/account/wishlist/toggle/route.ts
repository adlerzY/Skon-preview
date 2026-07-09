import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { TOGGLE_WISHLIST_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`wishlist:${ip}`, { max: 30, windowMs: 5 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productId = Number(body?.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }

    const data = await fetchGraphQL(TOGGLE_WISHLIST_MUTATION, { productId }, [], "no-store", token);
    const inWishlist = data?.toggleWishlistItem?.inWishlist;

    if (typeof inWishlist !== "boolean") {
      return NextResponse.json({ error: "خطا در بروزرسانی علاقه‌مندی‌ها" }, { status: 500 });
    }

    return NextResponse.json({ success: true, inWishlist });
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}