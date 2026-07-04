import "server-only";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "./constants";

export interface SessionUser {
  id: string;
  databaseId: number;
  name: string;
  email: string;
}

const VIEWER_QUERY = `
  query GetViewer {
    viewer {
      id
      databaseId
      name
      email
    }
  }
`;

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const data = await fetchGraphQL(VIEWER_QUERY, {}, [], "no-store", token);
    if (!data?.viewer?.id) return null;
    return data.viewer as SessionUser;
  } catch {
    return null;
  }
}