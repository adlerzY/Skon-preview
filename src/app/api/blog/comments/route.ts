import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { POST_COMMENTS_QUERY, WRITE_BLOG_COMMENT_MUTATION } from "@/lib/graphql/blog";
import { resolveAvatarUrl } from "@/lib/avatars";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`blog-comments-list:${ip}`, { max: 60, windowMs: 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const postId = request.nextUrl.searchParams.get("postId");
  const after = request.nextUrl.searchParams.get("after") || undefined;

  if (!postId) return NextResponse.json({ error: "شناسه پست نامعتبر است" }, { status: 400 });

  const data = await fetchGraphQL(POST_COMMENTS_QUERY, { id: postId, after }, [], "no-store");
  const connection = data?.post?.comments;
  const rawNodes = connection?.nodes ?? [];

  const nodes = await Promise.all(
    rawNodes.map(async (c: any) => ({
      ...c,
      author: {
        node: {
          ...c.author?.node,
          avatarUrl: await resolveAvatarUrl(c.author?.node?.avatarUrl),
        },
      },
    }))
  );

  return NextResponse.json({
    comments: nodes,
    pageInfo: connection?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`blog-comment-write:${ip}`, { max: 15, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const postId = Number(body?.postId);
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: "شناسه پست نامعتبر است" }, { status: 400 });
    }
    if (content.length < 2) {
      return NextResponse.json({ error: "متن نظر خیلی کوتاه است" }, { status: 400 });
    }

    const data = await fetchGraphQL(WRITE_BLOG_COMMENT_MUTATION, { postId, content }, [], "no-store", token);
    if (!data?.writeBlogComment?.success) {
      return NextResponse.json({ error: "ثبت نظر با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, approved: Boolean(data.writeBlogComment.approved) });
  } catch (error) {
    console.error("Write blog comment error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}