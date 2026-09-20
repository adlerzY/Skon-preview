import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
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


export const getAuthToken = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
});

export const getSessionId = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_ID_COOKIE)?.value ?? null;
});

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const sessionId = await getSessionId();
    const data = await fetchGraphQL(
      VIEWER_QUERY,
      {},
      [],
      "no-store",
      token,
      sessionId ?? undefined,
    );
    if (!data?.viewer?.id) return null;

    const viewer = data.viewer;
    const avatarId = viewer.avatarUrl ?? null;
    const avatarUrl = await resolveAvatarUrl(avatarId);

    return {
      ...viewer,
      avatarId,
      avatarUrl,
      isStaff: Boolean(viewer.isStaff),
      hasManualPassword: Boolean(viewer.hasManualPassword),
      adminPermissions: [],
    } as SessionUser;
  } catch {
    return null;
  }
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
  const token = await getAuthToken();
  if (!token) return { user: null };

  try {
    const sessionId = await getSessionId();
    const data = await fetchGraphQL(
      `
        query GetHeaderViewer {
          viewer {
            id
            name
            avatarUrl
            isStaff
          }
        }
      `,
      {},
      [],
      "no-store",
      token,
      sessionId ?? undefined,
    );
    const viewer = data?.viewer;

    if (!viewer?.id) return { user: null };

    const avatarUrl = await resolveAvatarUrl(viewer.avatarUrl ?? null);

    return {
      user: { name: viewer.name, avatarUrl, isStaff: Boolean(viewer.isStaff) },
    };
  } catch {
    return { user: null };
  }
});
