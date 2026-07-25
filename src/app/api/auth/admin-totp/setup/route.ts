import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { REQUEST_ADMIN_TOTP_SETUP_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-totp-setup:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const pendingTicket = typeof body?.pendingTicket === "string" ? body.pendingTicket : "";
    if (!pendingTicket) {
      return NextResponse.json({ error: "نشست نامعتبر است" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(REQUEST_ADMIN_TOTP_SETUP_MUTATION, { pendingTicket });

    if (!data?.requestAdminTotpSetup?.secret) {
      return NextResponse.json({ error: errorMessage || "خطا در تنظیم تأیید دومرحله‌ای" }, { status: 400 });
    }

    return NextResponse.json({
      secret: data.requestAdminTotpSetup.secret,
      otpauthUrl: data.requestAdminTotpSetup.otpauthUrl,
    });
  } catch (error) {
    console.error("Admin TOTP setup error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}