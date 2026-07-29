// src/app/api/auth/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { LOGIN_WITH_USERNAME_PASSWORD_MUTATION } from "@/lib/graphql/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`admin-login:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد تلاش‌های ورود بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(LOGIN_WITH_USERNAME_PASSWORD_MUTATION, { username, password });

    const result = data?.loginWithUsernamePassword;
    if (!result?.pendingTicket) {
      return NextResponse.json({ error: errorMessage || "ورود ناموفق بود" }, { status: 401 });
    }

    return NextResponse.json({
      requiresAdminTotp: Boolean(result.requiresAdminTotp),
      requiresAdminTotpSetup: Boolean(result.requiresAdminTotpSetup),
      pendingTicket: result.pendingTicket,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}