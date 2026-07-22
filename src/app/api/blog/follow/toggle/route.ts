import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { FOLLOW_CATEGORY_MUTATION, UNFOLLOW_CATEGORY_MUTATION } from "@/lib/graphql/blog";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`blog-follow:${ip}`, { max: 30, windowMs: 5 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const categoryId = Number(body?.categoryId);
    const follow = Boolean(body?.follow);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ error: "شناسه دسته‌بندی نامعتبر است" }, { status: 400 });
    }

    const data = await fetchGraphQL(
      follow ? FOLLOW_CATEGORY_MUTATION : UNFOLLOW_CATEGORY_MUTATION,
      { categoryId },
      [],
      "no-store",
      token
    );

    const result = follow ? data?.followBlogCategory : data?.unfollowBlogCategory;
    if (!result?.success) {
      return NextResponse.json({ error: "خطا در بروزرسانی دنبال‌کردن" }, { status: 500 });
    }

    return NextResponse.json({ success: true, isFollowing: result.isFollowing });
  } catch (error) {
    console.error("Blog follow toggle error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}