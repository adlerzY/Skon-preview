import { NextResponse } from "next/server";
import { getHeaderPublicNavigationData } from "@/lib/graphql";

export async function GET() {
  try {
    const { shopItems: games } = await getHeaderPublicNavigationData();
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
