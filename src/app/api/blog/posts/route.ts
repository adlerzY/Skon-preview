import { NextRequest, NextResponse } from "next/server";
import { getAllBlogPosts } from "@/lib/graphql";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") || undefined;
  const after = request.nextUrl.searchParams.get("after") || undefined;

  const result = await getAllBlogPosts({ search, after });
  return NextResponse.json(result);
}