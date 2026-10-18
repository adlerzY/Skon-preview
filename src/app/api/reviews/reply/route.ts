import { NextRequest, NextResponse } from "next/server";
import { adminMutation, ADMIN_MUTATIONS } from "@/lib/admin/server";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { getAuthToken, getCurrentAdminUser } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { readJsonBody, requestBodyErrorResponse } from "@/lib/requestBody";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`review-reply:${ip}`, { max: 20, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const admin = await getCurrentAdminUser();
  if (!admin || !admin.adminPermissions.includes(ADMIN_PERMISSIONS.REVIEWS_MODERATE)) {
    return NextResponse.json({ error: "فقط پشتیبانی مجاز به پاسخ‌دهی است" }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, 32 * 1024);
    const reviewId = Number(body?.reviewId);
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "شناسه نظر نامعتبر است" }, { status: 400 });
    }
    if (content.length < 2 || content.length > 5000) {
      return NextResponse.json({ error: "متن پاسخ باید بین ۲ تا ۵٬۰۰۰ کاراکتر باشد" }, { status: 400 });
    }

    const data = await adminMutation(
      ADMIN_MUTATIONS.replyReview,
      { reviewId, content },
      ADMIN_PERMISSIONS.REVIEWS_MODERATE,
    );

    if (!data?.adminReplyToReview?.success) {
      return NextResponse.json({ error: "ثبت پاسخ با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    console.error("Reply to review error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}