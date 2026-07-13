import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { fetchGraphQL } from "@/lib/graphql";
import { LOGIN_MUTATION, REGISTER_SESSION_MUTATION } from "@/lib/graphql/auth";
import {
  AUTH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  LOGGED_IN_COOKIE,
  SESSION_ID_COOKIE,
  AUTH_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { detectDeviceLabel } from "@/lib/deviceLabel";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`login:${ip}`, { max: 10, windowMs: 5 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "تعداد تلاش‌های ورود بیش از حد مجاز است. چند دقیقه دیگر تلاش کنید." },
      { status: 429, headers: { "Retry-After": "300" } }
    );
  }

  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
    }

    const data = await fetchGraphQL(LOGIN_MUTATION, { username, password }, [], "no-store");
    const result = data?.login;

    if (!result?.authToken || !result?.user) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }

    const sessionId = randomUUID();
    const userAgent = request.headers.get("user-agent") || "";

    await fetchGraphQL(
      REGISTER_SESSION_MUTATION,
      { sessionId, deviceLabel: detectDeviceLabel(userAgent), ipAddress: ip, userAgent },
      [],
      "no-store",
      result.authToken
    );

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      user: { name: result.user.name, email: result.user.email },
    });

    response.cookies.set(AUTH_TOKEN_COOKIE, result.authToken, {
      httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: AUTH_TOKEN_MAX_AGE,
    });

    if (result.refreshToken) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, result.refreshToken, {
        httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: REFRESH_TOKEN_MAX_AGE,
      });
    }

    response.cookies.set(LOGGED_IN_COOKIE, "1", {
      httpOnly: false, secure: isProd, sameSite: "lax", path: "/", maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    response.cookies.set(SESSION_ID_COOKIE, sessionId, {
      httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور، دوباره تلاش کنید" }, { status: 500 });
  }
}