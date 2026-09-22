import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { WRITE_BLOG_COMMENT_MUTATION } from "@/lib/graphql/blog";
import { getPostComments } from "@/lib/graphql/blogComments";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { readJsonBody, requestBodyErrorResponse } from "@/lib/requestBody";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`blog-comments-list:${ip}`, { max: 60, windowMs: 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const postId = request.nextUrl.searchParams.get("postId");
  const after = request.nextUrl.searchParams.get("after") || undefined;

  if (!postId) return NextResponse.json({ error: "شناسه پست نامعتبر است" }, { status: 400 });

  const { comments, pageInfo } = await getPostComments(postId, after);
  return NextResponse.json({ comments, pageInfo });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`blog-comment-write:${ip}`, { max: 15, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await readJsonBody(request, 32 * 1024);
    const postId = Number(body?.postId);
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: "شناسه پست نامعتبر است" }, { status: 400 });
    }
    if (content.length < 2 || content.length > 5000) {
      return NextResponse.json({ error: "متن نظر باید بین ۲ تا ۵٬۰۰۰ کاراکتر باشد" }, { status: 400 });
    }

    const data = await fetchGraphQL(WRITE_BLOG_COMMENT_MUTATION, { postId, content }, [], "no-store", token);
    if (!data?.writeBlogComment?.success) {
      return NextResponse.json({ error: "ثبت نظر با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, approved: Boolean(data.writeBlogComment.approved) });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    console.error("Write blog comment error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}
