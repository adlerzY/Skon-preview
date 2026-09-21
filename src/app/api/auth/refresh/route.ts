import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { REFRESH_TOKEN_MUTATION, TOUCH_SESSION_MUTATION } from "@/lib/graphql/auth";
import {
  AUTH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
  AUTH_TOKEN_MAX_AGE,
} from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const REFRESH_COOLDOWN_COOKIE = "a2b_refresh_cooldown";
const SUCCESS_COOLDOWN_SECONDS = 90;
const FAILURE_COOLDOWN_SECONDS = 45;

function decodeJwtExp(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenRefreshNeeded(token: string | undefined): boolean {
  const exp = decodeJwtExp(token);
  if (!exp) return Boolean(token);
  return Math.floor(Date.now() / 1000) >= exp - 120;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(SESSION_ID_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set("a2b_logged_in", "", { path: "/", maxAge: 0 });
}

function setCooldown(response: NextResponse, seconds: number) {
  response.cookies.set(REFRESH_COOLDOWN_COOKIE, String(Math.floor(Date.now() / 1000) + seconds), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: seconds,
  });
}

function cooldownActive(value: string | undefined): boolean {
  const until = Number(value || 0);
  return Number.isFinite(until) && until > Math.floor(Date.now() / 1000);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
  const currentAuthToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const cooldown = cookieStore.get(REFRESH_COOLDOWN_COOKIE)?.value;

  if (cooldownActive(cooldown)) {
    return NextResponse.json({ success: true, skipped: true }, { status: 200 });
  }

  // Never spend a GraphQL request on an already-fresh access token. This is
  // particularly important because both the proxy and the long-lived client
  // refresher can reach this endpoint.
  if (currentAuthToken && !isTokenRefreshNeeded(currentAuthToken)) {
    const response = NextResponse.json({ success: true, skipped: true });
    setCooldown(response, SUCCESS_COOLDOWN_SECONDS);
    return response;
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`auth-refresh:${ip}`, { max: 6, windowMs: 5 * 60 * 1000 }))) {
    const response = NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
    setCooldown(response, FAILURE_COOLDOWN_SECONDS);
    return response;
  }

  if (!refreshToken || !sessionId) {
    const response = NextResponse.json({ code: "SESSION_EXPIRED", error: "نشست شما منقضی شده، دوباره وارد شوید" }, { status: 401 });
    setCooldown(response, FAILURE_COOLDOWN_SECONDS);
    clearAuthCookies(response);
    return response;
  }

  try {
    // The GraphQL client already uses one attempt for mutations, so a failed
    // refresh cannot recursively retry at this layer.
    const data = await fetchGraphQL(
      REFRESH_TOKEN_MUTATION,
      { refreshToken },
      [],
      "no-store",
      undefined,
      sessionId,
      undefined,
      currentAuthToken,
      { "X-BTL-Session-Refresh": "1" },
    );
    const newToken = data?.refreshJwtAuthToken?.authToken;

    if (!newToken || !currentAuthToken) {
      const response = NextResponse.json({ code: "SESSION_REFRESH_FAILED", error: "امکان تمدید نشست وجود ندارد" }, { status: 401 });
      setCooldown(response, FAILURE_COOLDOWN_SECONDS);
      clearAuthCookies(response);
      return response;
    }

    const touchData = await fetchGraphQL(
      TOUCH_SESSION_MUTATION,
      { sessionId },
      [],
      "no-store",
      newToken,
      sessionId,
      undefined,
      currentAuthToken,
      { "X-BTL-Session-Refresh": "1" },
    );
    if (touchData?.touchSession?.success !== true) {
      const response = NextResponse.json({ code: "SESSION_REFRESH_FAILED", error: "همگام‌سازی نشست انجام نشد؛ دوباره وارد شوید" }, { status: 401 });
      setCooldown(response, FAILURE_COOLDOWN_SECONDS);
      clearAuthCookies(response);
      return response;
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_TOKEN_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_TOKEN_MAX_AGE,
    });
    setCooldown(response, SUCCESS_COOLDOWN_SECONDS);
    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    const response = NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
    setCooldown(response, FAILURE_COOLDOWN_SECONDS);
    return response;
  }
}
