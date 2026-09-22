import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/server";
import { fetchGraphQL } from "@/lib/graphql";
import { ADMIN_SET_MAINTENANCE_MUTATION, SITE_MAINTENANCE_QUERY } from "@/lib/graphql/admin";
import { getAdminGraphQLHeaders } from "@/lib/admin/headers";
import { getAuthToken, getSessionId } from "@/lib/auth/session";
import { BYPASS_COOKIE } from "@/lib/maintenance";
import crypto from "node:crypto";

function createBypass(sessionId: string): { value: string; maxAge: number } | null {
  const secret = process.env.SESSION_BINDING_SECRET?.trim();
  if (!secret || !sessionId) return null;
  const maxAge = 10 * 60;
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const signature = crypto.createHmac("sha256", secret).update(`${sessionId}.${expiresAt}`).digest("hex");
  return { value: `${sessionId}.${expiresAt}.${signature}`, maxAge };
}

export async function GET() {
  await requireAdmin();
  const token = (await getAuthToken()) || undefined;
  const data = await fetchGraphQL(SITE_MAINTENANCE_QUERY, {}, [], "no-store", token, undefined, undefined, undefined, getAdminGraphQLHeaders());
  const sessionId = await getSessionId();
  const bypass = sessionId ? createBypass(sessionId) : null;
  const response = NextResponse.json({ enabled: data?.siteMaintenanceMode === true });
  if (bypass) response.cookies.set(BYPASS_COOKIE, bypass.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: bypass.maxAge });
  return response;
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const enabled = body?.enabled === true;
  const token = (await getAuthToken()) || undefined;
  const data = await fetchGraphQL(ADMIN_SET_MAINTENANCE_MUTATION, { enabled }, [], "no-store", token, undefined, undefined, undefined, getAdminGraphQLHeaders());
  const result = data?.setSiteMaintenanceMode;
  if (!result?.success) return NextResponse.json({ error: "تغییر وضعیت تعمیرات انجام نشد" }, { status: 500 });

  revalidateTag("site-maintenance", { expire: 0 });
  const sessionId = await getSessionId();
  const bypass = sessionId ? createBypass(sessionId) : null;
  const response = NextResponse.json({ enabled: Boolean(result.enabled) });
  if (bypass) response.cookies.set(BYPASS_COOKIE, bypass.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: bypass.maxAge });
  return response;
}
