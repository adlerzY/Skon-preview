import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { WRITE_REVIEW_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`review:${ip}`, { max: 5, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "تعداد نظرات ثبت‌شده بیش از حد مجاز است. کمی بعد دوباره تلاش کنید" },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "برای ثبت نظر ابتدا وارد حساب کاربری خود شوید" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const productId = Number(body?.productId);
    const rating = Number(body?.rating);
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "امتیاز باید بین ۱ تا ۵ باشد" }, { status: 400 });
    }
    if (content.length < 3) {
      return NextResponse.json({ error: "متن نظر خیلی کوتاه است" }, { status: 400 });
    }

    const data = await fetchGraphQL(
      WRITE_REVIEW_MUTATION,
      { productId, rating, content: content.slice(0, 1000) },
      [],
      "no-store",
      token
    );

    if (!data?.writeReview?.review) {
      return NextResponse.json(
        { error: "ثبت نظر با خطا مواجه شد. لطفاً دوباره تلاش کنید" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "نظر شما با موفقیت ثبت شد و پس از تأیید ادمین نمایش داده می‌شود.",
    });
  } catch (error) {
    console.error("Add review error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}