import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { REQUEST_PASSWORD_RESET_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`password-reset-request:${ip}`, { max: 8, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";

    if (!identifier) {
      return NextResponse.json({ error: "شماره موبایل یا ایمیل را وارد کنید" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(REQUEST_PASSWORD_RESET_MUTATION, { identifier });

    if (!data?.requestPasswordReset?.success) {
      return NextResponse.json({ error: errorMessage || "ارسال کد بازیابی با خطا مواجه شد" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      channel: data.requestPasswordReset.channel ?? (identifier.includes("@") ? "email" : "sms"),
      cooldownSeconds: data.requestPasswordReset.cooldownSeconds ?? 60,
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}