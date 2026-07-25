import "server-only";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { REGISTER_SESSION_MUTATION } from "@/lib/graphql/auth";
import {
  AUTH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  LOGGED_IN_COOKIE,
  SESSION_ID_COOKIE,
  IS_STAFF_COOKIE,
  AUTH_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/lib/auth/constants";
import { detectDeviceLabel } from "@/lib/deviceLabel";

export async function completeLogin(
  request: NextRequest,
  tokens: { authToken: string; refreshToken?: string | null },
  extra: Record<string, unknown> = {}
) {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
  const sessionId = existingSessionId || randomUUID();
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  await fetchGraphQL(
    REGISTER_SESSION_MUTATION,
    { sessionId, deviceLabel: detectDeviceLabel(userAgent), ipAddress: ip, userAgent },
    [],
    "no-store",
    tokens.authToken
  );

  const viewerData = await fetchGraphQL(`query { viewer { isStaff } }`, {}, [], "no-store", tokens.authToken);

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ success: true, ...extra });

  response.cookies.set(AUTH_TOKEN_COOKIE, tokens.authToken, {
    httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: AUTH_TOKEN_MAX_AGE,
  });

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  response.cookies.set(LOGGED_IN_COOKIE, "1", {
    httpOnly: false, secure: isProd, sameSite: "lax", path: "/", maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  response.cookies.set(SESSION_ID_COOKIE, sessionId, {
    httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  response.cookies.set(IS_STAFF_COOKIE, viewerData?.viewer?.isStaff ? "1" : "0", {
    httpOnly: false, secure: isProd, sameSite: "lax", path: "/", maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return response;
}