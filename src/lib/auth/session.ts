import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { AUTH_TOKEN_COOKIE, SESSION_ID_COOKIE } from "./constants";
import { resolveAvatarUrl } from "@/lib/avatars";
import { getAdminGraphQLHeaders } from "@/lib/admin/headers";

export interface SessionUser {
  id: string;
  databaseId: number;
  name: string;
  email: string;
  avatarId: string | null;
  avatarUrl: string | null;
  isStaff: boolean;
  hasManualPassword: boolean;
  adminPermissions: string[];
}

export interface HeaderViewerData {
  user: { name: string; avatarUrl: string | null; isStaff: boolean } | null;
}

export type SessionState =
  | { status: "anonymous" }
  | { status: "authenticated"; user: SessionUser }
  | { status: "unavailable" };

const VIEWER_QUERY = `
  query GetViewer {
    viewer {
      id
      databaseId
      name
      email
      avatarUrl
      isStaff
      hasManualPassword
    }
  }
`;

const ADMIN_VIEWER_QUERY = `
  query GetAdminViewer {
    viewer {
      id
      databaseId
      name
      email
      avatarUrl
      isStaff
      hasManualPassword
      adminPermissions
    }
  }
`;

const AUTH_FAILURE_PATTERN = /btl_session_denied|expired|signature|segments|token|jwt/i;
const VIEWER_MAX_ATTEMPTS = 2;
const VIEWER_RETRY_DELAY_MS = 300;
const VIEWER_RETRY_WINDOW_MS = 4000;
const SESSION_TTL_MS = 20_000;
const SESSION_CACHE_LIMIT = 500;

const sessionCache = new Map<string, { user: SessionUser; expiresAt: number }>();
const sessionInflight = new Map<string, Promise<SessionState>>();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tokenKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function invalidateSessionCache(token?: string | null) {
  if (!token) return;
  const key = tokenKey(token);
  sessionCache.delete(key);
  sessionInflight.delete(key);
}

function storeSession(key: string, user: SessionUser) {
  const now = Date.now();
  if (sessionCache.size >= SESSION_CACHE_LIMIT) {
    for (const [cacheKey, entry] of sessionCache) {
      if (entry.expiresAt <= now) sessionCache.delete(cacheKey);
    }
    if (sessionCache.size >= SESSION_CACHE_LIMIT) sessionCache.clear();
  }
  sessionCache.set(key, { user, expiresAt: now + SESSION_TTL_MS });
}

export const getAuthToken = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
});

export const getSessionId = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_ID_COOKIE)?.value ?? null;
});

async function lookupViewer(token: string, sessionId?: string): Promise<SessionState> {
  for (let attempt = 1; attempt <= VIEWER_MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    const { data, errorMessage } = await fetchGraphQLWithErrors(VIEWER_QUERY, {}, token, sessionId);
    const viewer = data?.viewer;

    if (viewer?.id) {
      const avatarId: string | null = viewer.avatarUrl ?? null;
      const avatarUrl = await resolveAvatarUrl(avatarId).catch(() => null);

      return {
        status: "authenticated",
        user: {
          ...viewer,
          avatarId,
          avatarUrl,
          isStaff: Boolean(viewer.isStaff),
          hasManualPassword: Boolean(viewer.hasManualPassword),
          adminPermissions: [],
        } as SessionUser,
      };
    }

    if (data && viewer === null) return { status: "anonymous" };
    if (errorMessage && AUTH_FAILURE_PATTERN.test(errorMessage)) return { status: "anonymous" };

    const canRetry = attempt < VIEWER_MAX_ATTEMPTS && Date.now() - startedAt < VIEWER_RETRY_WINDOW_MS;
    if (!canRetry) break;
    await wait(VIEWER_RETRY_DELAY_MS);
  }

  console.error("[session] viewer lookup failed after retries");
  return { status: "unavailable" };
}

export const getSessionState = cache(async (): Promise<SessionState> => {
  const [token, sessionId] = await Promise.all([getAuthToken(), getSessionId()]);
  if (!token) return { status: "anonymous" };

  const key = tokenKey(token);
  const hit = sessionCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return { status: "authenticated", user: hit.user };

  const pending = sessionInflight.get(key);
  if (pending) return pending;

  const promise: Promise<SessionState> = lookupViewer(token, sessionId ?? undefined)
    .then((state) => {
      if (state.status === "authenticated" && sessionInflight.get(key) === promise) {
        storeSession(key, state.user);
      }
      return state;
    })
    .finally(() => {
      if (sessionInflight.get(key) === promise) sessionInflight.delete(key);
    });

  sessionInflight.set(key, promise);
  return promise;
});

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const state = await getSessionState();
  return state.status === "authenticated" ? state.user : null;
});

export const getCurrentAdminUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const sessionId = await getSessionId();
    const data = await fetchGraphQL(
      ADMIN_VIEWER_QUERY,
      {},
      [],
      "no-store",
      token,
      sessionId ?? undefined,
      undefined,
      undefined,
      getAdminGraphQLHeaders(),
    );
    if (!data?.viewer?.id || !data.viewer.isStaff) return null;

    const viewer = data.viewer;
    const avatarId = viewer.avatarUrl ?? null;
    const avatarUrl = await resolveAvatarUrl(avatarId);

    return {
      ...viewer,
      avatarId,
      avatarUrl,
      isStaff: true,
      hasManualPassword: Boolean(viewer.hasManualPassword),
      adminPermissions: Array.isArray(viewer.adminPermissions)
        ? viewer.adminPermissions.filter((permission: unknown): permission is string => typeof permission === "string")
        : [],
    } as SessionUser;
  } catch {
    return null;
  }
});

export const getHeaderViewerData = cache(async (): Promise<HeaderViewerData> => {
  const state = await getSessionState();
  if (state.status !== "authenticated") return { user: null };
  const { user } = state;
  return { user: { name: user.name, avatarUrl: user.avatarUrl, isStaff: user.isStaff } };
});