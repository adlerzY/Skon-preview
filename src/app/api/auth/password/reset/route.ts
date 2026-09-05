import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { RESET_PASSWORD_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { completeLogin } from "@/lib/auth/completeLogin";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`password-reset:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!identifier || !code || !newPassword) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(RESET_PASSWORD_MUTATION, { identifier, code, newPassword });

    const result = data?.resetPassword;
    if (!result?.success) {
      return NextResponse.json({ error: errorMessage || "بازیابی رمز عبور با خطا مواجه شد" }, { status: 400 });
    }

    if (result.requiresLogin || !result.authToken) {
      return NextResponse.json({ success: true, requiresLogin: true });
    }

    return completeLogin(request, { authToken: result.authToken, refreshToken: result.refreshToken });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}