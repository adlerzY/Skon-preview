import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { REVOKE_SESSION_MUTATION } from "@/lib/graphql/auth";
import {
  AUTH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  LOGGED_IN_COOKIE,
  IS_STAFF_COOKIE,
  SESSION_ID_COOKIE,
} from "@/lib/auth/constants";
import { invalidateSessionCache } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`revoke-session:${ip}`, { max: 20, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const store = await cookies();
  const token = store.get(AUTH_TOKEN_COOKIE)?.value;
  const currentSessionId = store.get(SESSION_ID_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) {
      return NextResponse.json({ error: "شناسه نشست نامعتبر است" }, { status: 400 });
    }

    const data = await fetchGraphQL(REVOKE_SESSION_MUTATION, { sessionId }, [], "no-store", token);
    if (!data?.revokeSession?.success) {
      return NextResponse.json({ error: "خروج از این نشست با خطا مواجه شد" }, { status: 500 });
    }

    invalidateSessionCache(token);

    const isCurrent = Boolean(currentSessionId) && sessionId === currentSessionId;
    const response = NextResponse.json({ success: true, current: isCurrent });

    if (isCurrent) {
      for (const name of [AUTH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, LOGGED_IN_COOKIE, IS_STAFF_COOKIE, SESSION_ID_COOKIE]) {
        response.cookies.set(name, "", {
          httpOnly: name !== LOGGED_IN_COOKIE,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}