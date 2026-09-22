import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE, SESSION_ID_COOKIE } from "@/lib/auth/constants";
import { SITE_MAINTENANCE_QUERY } from "@/lib/graphql/admin";

export const MAINTENANCE_CACHE_TAG = "site-maintenance";
const BYPASS_COOKIE = "a2b_maintenance_bypass";

function verifyBypass(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const [sessionId, expiresAt, signature] = value.split(".");
    if (!sessionId || !expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
    const secret = process.env.SESSION_BINDING_SECRET?.trim();
    if (!secret) return false;
    const expected = createHmac("sha256", secret).update(`${sessionId}.${expiresAt}`).digest("hex");
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function isMaintenanceEnabled(): Promise<boolean> {
  const data = await fetchGraphQL(
    SITE_MAINTENANCE_QUERY,
    {},
    [MAINTENANCE_CACHE_TAG],
    { type: "revalidate", seconds: 30 },
  );
  return data?.siteMaintenanceMode === true;
}

export async function hasMaintenanceBypass(): Promise<boolean> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const currentSessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
  const bypass = cookieStore.get(BYPASS_COOKIE)?.value;
  if (!authToken || !currentSessionId || !bypass) return false;
  const [sessionId] = bypass.split(".");
  if (sessionId !== currentSessionId || !verifyBypass(bypass)) return false;

  try {
    const parts = authToken.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { exp?: unknown };
    const exp = Number(payload.exp);
    return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export { BYPASS_COOKIE };
