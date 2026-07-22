import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { RATE_POST_MUTATION } from "@/lib/graphql/blog";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`blog-rate:${ip}`, { max: 30, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const postId = Number(body?.postId);
    const rating = Number(body?.rating);

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: "شناسه پست نامعتبر است" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "امتیاز باید بین ۱ تا ۵ باشد" }, { status: 400 });
    }

    const data = await fetchGraphQL(RATE_POST_MUTATION, { postId, rating }, [], "no-store", token);
    const result = data?.rateBlogPost;

    if (!result?.success) {
      return NextResponse.json({ error: "ثبت امتیاز با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      averageRating: result.averageRating,
      ratingCount: result.ratingCount,
      myRating: result.myRating,
    });
  } catch (error) {
    console.error("Rate post error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}