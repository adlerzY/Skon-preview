import { NextRequest, NextResponse } from "next/server";
import { searchProductsByKeyword } from "@/actions/search";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`search:${ip}`, { max: 90, windowMs: 60 * 1000 }))) {
    return NextResponse.json(
      { error: "تعداد درخواست بیش از حد مجاز است" },
      { status: 429, headers: { "Retry-After": "30" } }
    );
  }

  const params = request.nextUrl.searchParams;
  const query = (params.get("q") || "").trim().slice(0, 100);
  if (query.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const first = Math.min(Math.max(Number(params.get("first")) || 6, 1), 12);
  const result = await searchProductsByKeyword(query, params.get("region") || "", { first });

  return NextResponse.json(
    { products: result.products },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120" } }
  );
}