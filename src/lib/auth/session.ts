import "server-only";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE, SESSION_ID_COOKIE } from "./constants";
import { resolveAvatarUrl } from "@/lib/avatars";

export interface SessionUser {
  id: string;
  databaseId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
}

const VIEWER_QUERY = `
  query GetViewer($sessionId: String) {
    viewer {
      id
      databaseId
      name
      email
      avatarUrl
      activeSessionValid(sessionId: $sessionId)
    }
  }
`;

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_ID_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const sessionId = await getSessionId();
    const data = await fetchGraphQL(VIEWER_QUERY, { sessionId }, [], "no-store", token);
    if (!data?.viewer?.id) return null;
    if (data.viewer.activeSessionValid === false) return null;

    const viewer = data.viewer;
    const avatarUrl = await resolveAvatarUrl(viewer.avatarUrl);

    return { ...viewer, avatarUrl } as SessionUser;
  } catch {
    return null;
  }
}