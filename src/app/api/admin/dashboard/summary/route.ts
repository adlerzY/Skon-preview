import { NextResponse } from "next/server";
import { getAdminSummary } from "@/lib/admin/server";

export async function GET() {
  try {
    const summary = await getAdminSummary();
    if (!summary) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    return NextResponse.json({ summary }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Admin dashboard summary error:", error);
    return NextResponse.json({ error: "خطا در دریافت اطلاعات مدیریت" }, { status: 500 });
  }
}
