import { NextRequest, NextResponse } from "next/server";
import { KNOWN_REGIONS, DEFAULT_REGION } from "@/lib/regions";
import { IS_STAFF_COOKIE } from "@/lib/auth/constants";
import {
  getFreshProxyMaintenanceState,
  getLastKnownProxyMaintenanceState,
  setProxyMaintenanceState,
  type ProxyMaintenanceState,
} from "@/lib/maintenanceProxyState";

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
const MAINTENANCE_REQUEST_TIMEOUT_MS = 800;
const MAINTENANCE_CACHE_TTL_MS = 60_000;
const STAFF_STATUS_CACHE_TTL_MS = 5_000;

const SITE_MAINTENANCE_QUERY = `
  query GetSiteMaintenanceMode {
    siteMaintenanceSettings { enabled title description }
  }
`;

const STAFF_STATUS_QUERY = `
  query GetMaintenanceViewer {
    viewer { id isStaff }
  }
`;

let maintenanceRequest: Promise<ProxyMaintenanceState> | null = null;
const staffStatusCache = new Map<string, { expiresAt: number; isStaff: boolean }>();

const PUBLIC_GRAPHQL_HOST = (() => {
  try {
    return new URL(WP_GRAPHQL_URL || FALLBACK_PROD_URL).host;
  } catch {
    return undefined;
  }
})();

const refreshInFlight = new Map<string, Promise<string | null>>();

function safeInternalHeader(value: string, maxLength = 2000): string {
  return String(value).replace(/[\r\n]/g, " ").slice(0, maxLength);
}

async function getStaffStatus(request: NextRequest, tokenOverride?: string): Promise<boolean> {
  const token = tokenOverride || request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return false;

  const now = Date.now();
  const cached = staffStatusCache.get(token);
  if (cached && cached.expiresAt > now) return cached.isStaff;
  if (cached) staffStatusCache.delete(token);

  const { url, hostHeader } = resolveEndpoint();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MAINTENANCE_REQUEST_TIMEOUT_MS);
  try {
    const adminSharedSecret = process.env.BTL_ADMIN_GRAPHQL_SHARED_SECRET?.trim();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-BTL-Admin-Request": "1",
        ...(adminSharedSecret ? { "X-BTL-Admin-Secret": adminSharedSecret } : {}),
        ...(hostHeader ? { Host: hostHeader } : {}),
      },
      body: JSON.stringify({ query: STAFF_STATUS_QUERY }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    const isStaff = json?.data?.viewer?.isStaff === true && !json?.errors?.length;
    staffStatusCache.set(token, { expiresAt: Date.now() + STAFF_STATUS_CACHE_TTL_MS, isStaff });
    if (staffStatusCache.size > 32) {
      const oldestKey = staffStatusCache.keys().next().value;
      if (oldestKey) staffStatusCache.delete(oldestKey);
    }
    return isStaff;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getMaintenanceState(): Promise<ProxyMaintenanceState> {
  const fresh = getFreshProxyMaintenanceState();
  if (fresh) return fresh;
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
      if (!res.ok) {
        return getLastKnownProxyMaintenanceState() ?? { enabled: false, title: "", description: "" };
      }
      const json = await res.json().catch(() => null);
      const settings = json?.data?.siteMaintenanceSettings;
      const state: ProxyMaintenanceState = {
        enabled: settings?.enabled === true,
        title: typeof settings?.title === "string" ? settings.title : "",
        description: typeof settings?.description === "string" ? settings.description : "",
      };
      setProxyMaintenanceState(state, MAINTENANCE_CACHE_TTL_MS);
      return state;
    } catch {
      return getLastKnownProxyMaintenanceState() ?? { enabled: false, title: "", description: "" };
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

  const isMaintenanceRoute = pathname === "/maintenance" || pathname.startsWith("/maintenance/");
  const isAdminLoginRoute = pathname === "/admin-login" || pathname.startsWith("/admin-login/");
  const isPublicHeaderNavigationApi = pathname === "/api/header/navigation";
  const shouldCheckMaintenance = !pathname.startsWith("/api") && !isMaintenanceRoute && !isAdminRoute && !isAdminLoginRoute;
  const maintenancePromise = shouldCheckMaintenance ? getMaintenanceState() : null;
  const refreshed = hasAuthToken && !isPublicHeaderNavigationApi
    ? await applyAuthRefresh(request)
    : { token: null, cooldownSeconds: 0, failed: false };

  if (pathname.startsWith("/api")) {
    const forwardedHeaders = new Headers(request.headers);
    if (refreshed.failed) {
      forwardedHeaders.set("x-a2b-session-refresh-failed", "1");
    }
    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    return finalizeAuthCookie(response, refreshed);
  }

  if (maintenancePromise) {
    const maintenance = await maintenancePromise;
    if (maintenance.enabled) {
      const staffCookie = request.cookies.get(IS_STAFF_COOKIE)?.value;
      const isStaff = staffCookie === "1" || (staffCookie !== "0" && await getStaffStatus(request, refreshed.token ?? undefined));
      if (!isStaff) {
        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        url.search = "";
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-a2b-maintenance-enabled", "1");
        requestHeaders.set("x-a2b-maintenance-title", safeInternalHeader(maintenance.title, 500));
        requestHeaders.set("x-a2b-maintenance-description", safeInternalHeader(maintenance.description, 2000));
        const response = NextResponse.rewrite(url, {
          request: { headers: requestHeaders },
        });
        response.headers.set("Cache-Control", "no-store, max-age=0");
        response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
        return finalizeAuthCookie(response, refreshed);
      }

      const response = NextResponse.next({ request });
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
