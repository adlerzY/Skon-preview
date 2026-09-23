import { NextResponse } from "next/server";
import { getHeaderPublicNavigationData } from "@/lib/graphql";

export async function GET() {
  try {
    const data = await getHeaderPublicNavigationData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { shopItems: [], blogItems: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
