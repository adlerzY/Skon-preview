import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { LOGIN_WITH_PASSWORD_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { completeLogin } from "@/lib/auth/completeLogin";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`login-password:${ip}`, { max: 10, windowMs: 5 * 60 * 1000 }))) {
    return NextResponse.json(
      { error: "تعداد تلاش‌های ورود بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید." },
      { status: 429, headers: { "Retry-After": "300" } }
    );
  }

  try {
    const body = await request.json();
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "شماره موبایل یا ایمیل و رمز عبور الزامی است" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(LOGIN_WITH_PASSWORD_MUTATION, { identifier, password });

    const result = data?.loginWithPassword;
    if (!result) {
      return NextResponse.json({ error: errorMessage || "اطلاعات ورود اشتباه است" }, { status: 401 });
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

    return completeLogin(request, { authToken: result.authToken, refreshToken: result.refreshToken });
  } catch (error) {
    console.error("Login with password error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}