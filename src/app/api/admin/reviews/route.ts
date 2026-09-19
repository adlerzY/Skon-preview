import { NextRequest, NextResponse } from "next/server";
import { adminMutation, getAdminReviews, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const data = await getAdminReviews({ state: params.get("state") || "pending", after: params.get("after") || undefined });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Admin reviews GET:", error);
    return NextResponse.json({ error: "خطا در دریافت دیدگاه‌ها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body?.action || "");
    const map: Record<string, string> = { moderate: ADMIN_MUTATIONS.moderateReview, reply: ADMIN_MUTATIONS.replyReview };
    if (!map[action]) return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
    const variables = action === "reply"
      ? { reviewId: Number(body.reviewId), content: String(body.content || "") }
      : { reviewId: Number(body.reviewId), action: String(body.moderationAction || "") };
    const data = await adminMutation(map[action], variables, ADMIN_PERMISSIONS.REVIEWS_MODERATE);
    return NextResponse.json(data ?? { success: false });
  } catch (error) {
    console.error("Admin reviews POST:", error);
    return NextResponse.json({ error: "عملیات دیدگاه انجام نشد" }, { status: 500 });
  }
}
