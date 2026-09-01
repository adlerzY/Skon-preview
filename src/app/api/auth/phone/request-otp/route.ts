import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { REQUEST_PHONE_OTP_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`phone-otp-request:${ip}`, { max: 8, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const website = typeof body?.website === "string" ? body.website.trim() : "";
    const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : "";

    if (website !== "") {
      return NextResponse.json({ success: true, cooldownSeconds: 60 });
    }

    if (!(await verifyTurnstileToken(turnstileToken, ip))) {
      return NextResponse.json({ error: "تأیید امنیتی ناموفق بود، صفحه را رفرش کنید و دوباره تلاش کنید" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: "شماره موبایل را وارد کنید" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(REQUEST_PHONE_OTP_MUTATION, { phone });

    if (!data?.requestPhoneOtp?.success) {
      return NextResponse.json({ error: errorMessage || "ارسال کد با خطا مواجه شد" }, { status: 400 });
    }

    return NextResponse.json({ success: true, cooldownSeconds: data.requestPhoneOtp.cooldownSeconds ?? 60 });
  } catch (error) {
    console.error("Request phone OTP error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}