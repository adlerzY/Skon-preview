import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { REQUEST_PHONE_OTP_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`phone-otp-request:${ip}`, { max: 8, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const turnstileToken = typeof body?.turnstileToken === "string" ? body.turnstileToken : "";

    if (!phone) {
      return NextResponse.json({ error: "شماره موبایل را وارد کنید" }, { status: 400 });
    }
    if (!turnstileToken) {
      return NextResponse.json({ error: "تأیید امنیتی انجام نشد، صفحه را رفرش کنید" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(REQUEST_PHONE_OTP_MUTATION, { phone, turnstileToken });

    if (!data?.requestPhoneOtp?.success) {
      return NextResponse.json({ error: errorMessage || "ارسال کد با خطا مواجه شد" }, { status: 400 });
    }

    return NextResponse.json({ success: true, cooldownSeconds: data.requestPhoneOtp.cooldownSeconds ?? 60 });
  } catch (error) {
    console.error("Request phone OTP error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}