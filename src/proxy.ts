import { NextRequest, NextResponse } from "next/server";
import { KNOWN_REGIONS, DEFAULT_REGION } from "@/lib/regions";
import { IS_STAFF_COOKIE } from "@/lib/auth/constants";

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
const REFRESH_FAILURE_COOLDOWN_SECONDS = 45;
const MAINTENANCE_REQUEST_TIMEOUT_MS = 2_500;
const MAINTENANCE_CACHE_TTL_MS = 1_500;

const SITE_MAINTENANCE_QUERY = `
  query GetSiteMaintenanceMode {
    siteMaintenanceSettings { enabled title description }
  }
`;

type MaintenanceState = { enabled: boolean; title: string; description: string };

let maintenanceCache: { expiresAt: number; state: MaintenanceState } | null = null;
let maintenanceRequest: Promise<MaintenanceState> | null = null;

const PUBLIC_GRAPHQL_HOST = (() => {
  try {
    return new URL(WP_GRAPHQL_URL || FALLBACK_PROD_URL).host;
  } catch {
    return undefined;
  }
})();

const refreshInFlight = new Map<string, Promise<string | null>>();

async function getMaintenanceState(): Promise<MaintenanceState> {
  const now = Date.now();
  if (maintenanceCache && maintenanceCache.expiresAt > now) return maintenanceCache.state;
  if (maintenanceRequest) return maintenanceRequest;

  maintenanceRequest = (async () => {
    const { url, hostHeader } = resolveEndpoint();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MAINTENANCE_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(hostHeader ? { Host: hostHeader } : {}),
        },
        body: JSON.stringify({ query: SITE_MAINTENANCE_QUERY }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) return maintenanceCache?.state ?? { enabled: false, title: "", description: "" };
      const json = await res.json().catch(() => null);
      const settings = json?.data?.siteMaintenanceSettings;
      const state = {
        enabled: settings?.enabled === true,
        title: typeof settings?.title === "string" ? settings.title : "",
        description: typeof settings?.description === "string" ? settings.description : "",
      };
      maintenanceCache = { expiresAt: Date.now() + MAINTENANCE_CACHE_TTL_MS, state };
      return state;
    } catch {
      return maintenanceCache?.state ?? { enabled: false, title: "", description: "" };
    } finally {
      clearTimeout(timeoutId);
      maintenanceRequest = null;
    }
  })();

  return maintenanceRequest;
}

function resolveEndpoint(): { url: string; hostHeader?: string } {
  const publicUrl = WP_GRAPHQL_URL || FALLBACK_PROD_URL;
  if (!INTERNAL_WP_GRAPHQL_URL) return { url: publicUrl };
  return { url: INTERNAL_WP_GRAPHQL_URL, hostHeader: PUBLIC_GRAPHQL_HOST };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decodedBinary = atob(padded);
    const bytes = Uint8Array.from(decodedBinary, (c) => c.charCodeAt(0));
    const jsonString = new TextDecoder().decode(bytes);
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
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

async function touchSessionBinding(
  newToken: string,
  previousAuthToken: string,
  sessionId: string
): Promise<boolean> {
  const { url, hostHeader } = resolveEndpoint();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        "X-BTL-Session-ID": sessionId,
        "X-BTL-Session-Refresh": "1",
        "X-BTL-Previous-Authorization": `Bearer ${previousAuthToken}`,
        ...(hostHeader ? { Host: hostHeader } : {}),
      },
      body: JSON.stringify({
        query: "mutation TouchSession($sessionId:String!){touchSession(input:{sessionId:$sessionId}){success}}",
        variables: { sessionId },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    return json?.data?.touchSession?.success === true && !json?.errors?.length;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
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
          "X-BTL-Session-ID": sessionId,
          "X-BTL-Session-Refresh": "1",
          "X-BTL-Previous-Authorization": `Bearer ${previousAuthToken}`,
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
      if (typeof token !== "string" || !token || json?.errors?.length) return null;
      if (!(await touchSessionBinding(token, previousAuthToken, sessionId))) return null;
      return token;
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

type RefreshOutcome = { token: string | null; cooldownSeconds: number; failed: boolean };

async function applyAuthRefresh(request: NextRequest): Promise<RefreshOutcome> {
  const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionId = request.cookies.get(SESSION_ID_COOKIE)?.value;
  const cooldown = request.cookies.get(REFRESH_COOLDOWN_COOKIE)?.value;

  if (!authToken || !refreshToken || !sessionId || !needsRefresh(authToken) || cooldownActive(cooldown)) {
    return { token: null, cooldownSeconds: 0, failed: false };
  }

  const newToken = await refreshAuthToken(refreshToken, sessionId, authToken);
  if (newToken) {
    request.cookies.set(AUTH_TOKEN_COOKIE, newToken);
  }
  return {
    token: newToken,
    cooldownSeconds: newToken ? REFRESH_SUCCESS_COOLDOWN_SECONDS : REFRESH_FAILURE_COOLDOWN_SECONDS,
    failed: !newToken,
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

  const refreshed = hasAuthToken ? await applyAuthRefresh(request) : { token: null, cooldownSeconds: 0, failed: false };

  if (pathname.startsWith("/api")) {
    const forwardedHeaders = new Headers(request.headers);
    if (refreshed.failed) {
      forwardedHeaders.set("x-a2b-session-refresh-failed", "1");
    }
    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    return finalizeAuthCookie(response, refreshed);
  }

  const isMaintenanceRoute = pathname === "/maintenance" || pathname.startsWith("/maintenance/");
  const isAdminLoginRoute = pathname === "/admin-login" || pathname.startsWith("/admin-login/");
  const isStaff = request.cookies.get(IS_STAFF_COOKIE)?.value === "1";

  if (!isMaintenanceRoute && !isAdminRoute && !isAdminLoginRoute && !isStaff) {
    const maintenance = await getMaintenanceState();
    if (maintenance.enabled) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      const response = NextResponse.rewrite(url);
      return finalizeAuthCookie(response, refreshed);
    }
  }

  const isNonRegionRoute =
    pathname.startsWith("/my-account") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/admin-login") ||
    pathname.startsWith("/admin") ||
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    pathname === "/product" ||
    pathname.startsWith("/product/") ||
    pathname === "/maintenance" ||
    pathname.startsWith("/maintenance/");

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
