import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { SET_PASSWORD_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getCurrentUser, getSessionId } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`set-password-ip:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  if (!(await checkRateLimit(`set-password-user:${user.databaseId}`, { max: 6, windowMs: 15 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد تلاش‌های تغییر رمز عبور بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : undefined;
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!newPassword) {
      return NextResponse.json({ error: "رمز عبور جدید را وارد کنید" }, { status: 400 });
    }

    const sessionId = await getSessionId();

    const { data, errorMessage } = await fetchGraphQLWithErrors(
      SET_PASSWORD_MUTATION,
      { currentPassword, newPassword, sessionId },
      token
    );

    if (!data?.setPassword?.success) {
      return NextResponse.json({ error: errorMessage || "بروزرسانی رمز عبور با خطا مواجه شد" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}