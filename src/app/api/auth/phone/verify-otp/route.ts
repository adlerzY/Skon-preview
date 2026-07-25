import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { VERIFY_PHONE_OTP_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { completeLogin } from "@/lib/auth/completeLogin";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`phone-otp-verify:${ip}`, { max: 15, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : undefined;
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;

    if (!phone || !code) {
      return NextResponse.json({ error: "شماره و کد تأیید الزامی است" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(VERIFY_PHONE_OTP_MUTATION, {
      phone, code, displayName, email,
    });

    const result = data?.verifyPhoneOtp;
    if (!result) {
      return NextResponse.json({ error: errorMessage || "کد وارد شده صحیح نیست" }, { status: 400 });
    }

    if (result.requiresProfile) {
      return NextResponse.json({ requiresProfile: true });
    }

    if (result.requiresAdminTotp || result.requiresAdminTotpSetup) {
      return NextResponse.json({
        requiresAdminTotp: Boolean(result.requiresAdminTotp),
        requiresAdminTotpSetup: Boolean(result.requiresAdminTotpSetup),
        pendingTicket: result.pendingTicket,
      });
    }

    if (!result.authToken) {
      return NextResponse.json({ error: "ورود با خطا مواجه شد" }, { status: 500 });
    }

    return completeLogin(
      request,
      { authToken: result.authToken, refreshToken: result.refreshToken },
      { isNewUser: Boolean(result.isNewUser) }
    );
  } catch (error) {
    console.error("Verify phone OTP error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}