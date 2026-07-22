import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { REPLY_BLOG_COMMENT_MUTATION } from "@/lib/graphql/blog";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`blog-comment-reply:${ip}`, { max: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });

  try {
    const body = await request.json();
    const commentId = Number(body?.commentId);
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return NextResponse.json({ error: "شناسه نظر نامعتبر است" }, { status: 400 });
    }
    if (content.length < 2) {
      return NextResponse.json({ error: "متن پاسخ خیلی کوتاه است" }, { status: 400 });
    }

    const data = await fetchGraphQL(REPLY_BLOG_COMMENT_MUTATION, { commentId, content }, [], "no-store", token);
    if (!data?.replyToBlogComment?.success) {
      return NextResponse.json({ error: "ثبت پاسخ با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reply blog comment error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}