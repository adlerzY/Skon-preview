import { decodeJwtPayload } from "@/lib/auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { KNOWN_REGIONS, DEFAULT_REGION } from "@/lib/regions";

const REGION_COOKIE = "store_region";
const AUTH_TOKEN_COOKIE = "a2b_auth_token";
const REFRESH_TOKEN_COOKIE = "a2b_refresh_token";
const SESSION_ID_COOKIE = "a2b_session_id";
const REFRESH_COOLDOWN_COOKIE = "a2b_refresh_cooldown";
const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 3;

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const INTERNAL_WP_GRAPHQL_URL = process.env.INTERNAL_WORDPRESS_API_URL;
const FALLBACK_PROD_URL = "https://api.arena2battle.com/graphql";
const REFRESH_TIMEOUT_MS = 6_000;
const REFRESH_SUCCESS_COOLDOWN_SECONDS = 90;

const PUBLIC_GRAPHQL_HOST = (() => {
  try {
    return new URL(WP_GRAPHQL_URL || FALLBACK_PROD_URL).host;
  } catch {
    return undefined;
  }
})();

const refreshInFlight = new Map<string, Promise<string | null>>();

function resolveEndpoint(): { url: string; hostHeader?: string } {
  const publicUrl = WP_GRAPHQL_URL || FALLBACK_PROD_URL;
  if (!INTERNAL_WP_GRAPHQL_URL) return { url: publicUrl };
  return { url: INTERNAL_WP_GRAPHQL_URL, hostHeader: PUBLIC_GRAPHQL_HOST };
}



function needsRefresh(token: string | undefined): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  const exp = payload && typeof payload.exp === "number" ? payload.exp : null;
  if (!exp) return true;
  return Math.floor(Date.now() / 1000) >= exp - 120;
}

function cooldownActive(value: string | undefined): boolean {
  const until = Number(value || 0);
  return Number.isFinite(until) && until > Math.floor(Date.now() / 1000);
}

async function refreshAuthToken(
  refreshToken: string,
  sessionId: string,
  previousAuthToken: string
): Promise<string | null> {
  const lockKey = sessionId;
  const existing = refreshInFlight.get(lockKey);
  if (existing) return existing;

  const operation = (async () => {
    const { url, hostHeader } = resolveEndpoint();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(hostHeader ? { Host: hostHeader } : {}),
        },
        body: JSON.stringify({
          query:
            "mutation RefreshToken($refreshToken: String!) { refreshJwtAuthToken(input: { jwtRefreshToken: $refreshToken }) { authToken } }",
          variables: { refreshToken },
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      const token = json?.data?.refreshJwtAuthToken?.authToken;
      if (typeof token !== "string" || !token) return null;

      const touchedController = new AbortController();
      const touchedTimeoutId = setTimeout(() => touchedController.abort(), REFRESH_TIMEOUT_MS);
      try {
        const touched = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-BTL-Session-ID": sessionId,
            "X-BTL-Previous-Authorization": `Bearer ${previousAuthToken}`,
            ...(hostHeader ? { Host: hostHeader } : {}),
          },
          body: JSON.stringify({
            query: "mutation TouchSession($sessionId: String!) { touchSession(input: { sessionId: $sessionId }) { success } }",
            variables: { sessionId },
          }),
          cache: "no-store",
          signal: touchedController.signal,
        });
        if (!touched.ok) return null;
        const touchedJson = await touched.json().catch(() => null);
        return touchedJson?.data?.touchSession?.success === true ? token : null;
      } finally {
        clearTimeout(touchedTimeoutId);
      }
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  refreshInFlight.set(lockKey, operation);
  try {
    return await operation;
  } finally {
    refreshInFlight.delete(lockKey);
  }
}

type RefreshOutcome = { token: string | null; cooldownSeconds: number };

async function applyAuthRefresh(request: NextRequest): Promise<RefreshOutcome> {
  const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionId = request.cookies.get(SESSION_ID_COOKIE)?.value;
  const cooldown = request.cookies.get(REFRESH_COOLDOWN_COOKIE)?.value;

  if (!authToken || !refreshToken || !sessionId || !needsRefresh(authToken) || cooldownActive(cooldown)) {
    return { token: null, cooldownSeconds: 0 };
  }

  const newToken = await refreshAuthToken(refreshToken, sessionId, authToken);
  if (newToken) {
    // Make the rotated token available to the current request as well as the
    // response cookie; otherwise the page being rendered could still use the
    // just-expired token.
    request.cookies.set(AUTH_TOKEN_COOKIE, newToken);
  }
  return {
    token: newToken,
    cooldownSeconds: newToken ? REFRESH_SUCCESS_COOLDOWN_SECONDS : 45,
  };
}

function finalizeAuthCookie(
  response: NextResponse,
  outcome: RefreshOutcome
): NextResponse {
  if (outcome.token) {
    response.cookies.set(AUTH_TOKEN_COOKIE, outcome.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_TOKEN_MAX_AGE,
    });
  }
  if (outcome.cooldownSeconds > 0) {
    response.cookies.set(REFRESH_COOLDOWN_COOKIE, String(Math.floor(Date.now() / 1000) + outcome.cooldownSeconds), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: outcome.cooldownSeconds,
    });
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const hasAuthToken = Boolean(request.cookies.get(AUTH_TOKEN_COOKIE)?.value);

  if (isAdminRoute && !hasAuthToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin-login";
    return NextResponse.redirect(url);
  }

  const refreshed = hasAuthToken ? await applyAuthRefresh(request) : { token: null, cooldownSeconds: 0 };

  const isNonRegionRoute =
    pathname.startsWith("/my-account") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/admin-login") ||
    pathname.startsWith("/admin");

  if (isNonRegionRoute) {
    const response = NextResponse.next({ request });
    return finalizeAuthCookie(response, refreshed);
  }

  const cookieRegion = request.cookies.get(REGION_COOKIE)?.value?.toLowerCase();
  const activeRegion =
    cookieRegion && KNOWN_REGIONS.includes(cookieRegion) ? cookieRegion : DEFAULT_REGION;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${activeRegion}`;
    const response = NextResponse.redirect(url);
    return finalizeAuthCookie(response, refreshed);
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (KNOWN_REGIONS.includes(firstSegment)) {
    const response = NextResponse.next({ request });
    if (cookieRegion !== firstSegment) {
      response.cookies.set(REGION_COOKIE, firstSegment, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return finalizeAuthCookie(response, refreshed);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${activeRegion}${pathname}`;
  const response = NextResponse.redirect(url);
  return finalizeAuthCookie(response, refreshed);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
