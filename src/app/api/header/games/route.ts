import { NextResponse } from "next/server";
import { getHeaderGameNavigationData } from "@/lib/graphql";

export async function GET() {
  try {
    const games = await getHeaderGameNavigationData();
    return NextResponse.json(
      { games },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { games: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
