import { NextResponse } from "next/server";
import { getHeaderViewerData } from "@/lib/auth/session";

export async function GET() {
  const { user } = await getHeaderViewerData().catch(() => ({ user: null }));

  return NextResponse.json(
    {
      user,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
