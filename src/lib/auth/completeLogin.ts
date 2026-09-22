import "server-only";
import { createHash, createHmac, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
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
import { getClientIp } from "@/lib/rateLimit";

export async function completeLogin(
  request: NextRequest,
  tokens: { authToken: string; refreshToken?: string | null },
  extra: Record<string, unknown> = {}
) {
  const sessionId = randomUUID();
  const userAgent = request.headers.get("user-agent") || "";
  const ip = getClientIp(request);

  let isStaff = false;
  const bindingSecret = process.env.SESSION_BINDING_SECRET;
  if (!bindingSecret) {
    return NextResponse.json({ success: false, error: "تنظیم امنیت نشست ناقص است" }, { status: 503 });
  }
  const tokenHash = createHash("sha256").update(tokens.authToken).digest("hex");
  const bootstrapProof = createHmac("sha256", bindingSecret).update(`${sessionId}.${tokenHash}`).digest("hex");
  try {
    const sessionData = await fetchGraphQL(
      REGISTER_SESSION_MUTATION,
      { sessionId, deviceLabel: detectDeviceLabel(userAgent), ipAddress: ip, userAgent },
      [],
      "no-store",
      tokens.authToken,
      sessionId,
      bootstrapProof
    );
    if (!sessionData?.registerSession?.success) throw new Error("session_registration_failed");
    isStaff = Boolean(sessionData.registerSession.isStaff);
  } catch {
    return NextResponse.json({ success: false, error: "ثبت نشست کاربری ناموفق بود؛ دوباره وارد شوید" }, { status: 503 });
  }

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ success: true, ...extra });

  response.cookies.set(AUTH_TOKEN_COOKIE, tokens.authToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_TOKEN_MAX_AGE,
  });

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  response.cookies.set(LOGGED_IN_COOKIE, "1", {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  response.cookies.set(SESSION_ID_COOKIE, sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  response.cookies.set(IS_STAFF_COOKIE, isStaff ? "1" : "0", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return response;
}