import { NextResponse } from "next/server";
import { getAdminDashboard } from "@/lib/admin/server";

export async function GET() {
  try {
    return NextResponse.json(await getAdminDashboard(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "خطا در دریافت اطلاعات مدیریت" }, { status: 500 });
  }
}
