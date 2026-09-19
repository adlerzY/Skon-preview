import { NextRequest, NextResponse } from "next/server";
import { getAllBlogPosts } from "@/lib/graphql";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") || undefined;
  const after = request.nextUrl.searchParams.get("after") || undefined;
  const catIdsParam = request.nextUrl.searchParams.get("catIds");
  const catSlugsParam = request.nextUrl.searchParams.get("catSlugs");
  const tagSlugsParam = request.nextUrl.searchParams.get("tagSlugs");

  const ip = getClientIp(request);
  const max = search ? 60 : 120;
  const windowMs = 60 * 1000;
  if (!(await checkRateLimit(`blog-posts-list:${ip}`, { max, windowMs }))) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها بیش از حد مجاز است" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const categoryIds = catIdsParam
    ? catIdsParam.split(",").map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0)
    : undefined;
  const categorySlugsForTags = catSlugsParam ? catSlugsParam.split(",").filter(Boolean) : undefined;
  const tagSlugs = tagSlugsParam ? tagSlugsParam.split(",").filter(Boolean) : undefined;

  const result = await getAllBlogPosts({ search, after, categoryIds, categorySlugsForTags, tagSlugs });
  return NextResponse.json(result);
}
