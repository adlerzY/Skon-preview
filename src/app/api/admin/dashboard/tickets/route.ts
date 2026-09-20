import { NextResponse } from "next/server";
import { getAdminOpenTickets } from "@/lib/admin/server";

export async function GET() {
  try {
    const tickets = await getAdminOpenTickets(6);
    return NextResponse.json({ tickets }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Admin dashboard tickets error:", error);
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
}
