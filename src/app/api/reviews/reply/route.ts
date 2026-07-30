import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { REPLY_TO_REVIEW_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`review-reply:${ip}`, { max: 20, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const reviewId = Number(body?.reviewId);
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "شناسه نظر نامعتبر است" }, { status: 400 });
    }
    if (content.length < 2) {
      return NextResponse.json({ error: "متن پاسخ خیلی کوتاه است" }, { status: 400 });
    }

    const data = await fetchGraphQL(REPLY_TO_REVIEW_MUTATION, { reviewId, content }, [], "no-store", token);

    if (!data?.replyToProductReview?.success) {
      return NextResponse.json({ error: "ثبت پاسخ با خطا مواجه شد (فقط پشتیبانی مجاز است)" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reply to review error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}