import { NextRequest, NextResponse } from "next/server";
import { getAllBlogPosts } from "@/lib/graphql";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") || undefined;
  const after = request.nextUrl.searchParams.get("after") || undefined;
  const catIdsParam = request.nextUrl.searchParams.get("catIds");
  const catSlugsParam = request.nextUrl.searchParams.get("catSlugs");
  const tagSlugsParam = request.nextUrl.searchParams.get("tagSlugs");

  const categoryIds = catIdsParam
    ? catIdsParam.split(",").map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0)
    : undefined;
  const categorySlugsForTags = catSlugsParam ? catSlugsParam.split(",").filter(Boolean) : undefined;
  const tagSlugs = tagSlugsParam ? tagSlugsParam.split(",").filter(Boolean) : undefined;

  const result = await getAllBlogPosts({ search, after, categoryIds, categorySlugsForTags, tagSlugs });
  return NextResponse.json(result);
}