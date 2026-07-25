import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { CONFIRM_ADMIN_TOTP_SETUP_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { completeLogin } from "@/lib/auth/completeLogin";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-totp-confirm:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const pendingTicket = typeof body?.pendingTicket === "string" ? body.pendingTicket : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!pendingTicket || !code) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(CONFIRM_ADMIN_TOTP_SETUP_MUTATION, { pendingTicket, code });

    const result = data?.confirmAdminTotpSetup;
    if (!result?.authToken) {
      return NextResponse.json({ error: errorMessage || "کد وارد شده صحیح نیست" }, { status: 400 });
    }

    return completeLogin(
      request,
      { authToken: result.authToken, refreshToken: result.refreshToken },
      { recoveryCodes: result.recoveryCodes ?? [] }
    );
  } catch (error) {
    console.error("Admin TOTP confirm error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}