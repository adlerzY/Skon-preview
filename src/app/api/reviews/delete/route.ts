import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { DELETE_MY_REVIEW_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`review-delete:${ip}`, { max: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const reviewId = Number(body?.reviewId);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "شناسه نظر نامعتبر است" }, { status: 400 });
    }

    const data = await fetchGraphQL(DELETE_MY_REVIEW_MUTATION, { reviewId }, [], "no-store", token);
    if (!data?.deleteMyReview?.success) {
      return NextResponse.json({ error: "حذف نظر با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}