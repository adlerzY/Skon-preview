import { NextResponse } from "next/server";
import { BYPASS_COOKIE } from "@/lib/maintenance";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { REVOKE_CURRENT_SESSION_MUTATION, REVOKE_SESSION_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, LOGGED_IN_COOKIE, IS_STAFF_COOKIE, SESSION_ID_COOKIE } from "@/lib/auth/constants";

export async function POST() {
  const store = await cookies();
  const token = store.get(AUTH_TOKEN_COOKIE)?.value;
  const sessionId = store.get(SESSION_ID_COOKIE)?.value;
  if (token && sessionId) {
    await fetchGraphQL(REVOKE_SESSION_MUTATION, { sessionId }, [], "no-store", token, sessionId);
  } else if (token) {
    await fetchGraphQL(REVOKE_CURRENT_SESSION_MUTATION, {}, [], "no-store", token);
  }
  const response = NextResponse.json({ success: true });
  for (const name of [AUTH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, LOGGED_IN_COOKIE, IS_STAFF_COOKIE, SESSION_ID_COOKIE, BYPASS_COOKIE]) {
    response.cookies.set(name, "", { httpOnly: name !== LOGGED_IN_COOKIE && name !== IS_STAFF_COOKIE, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  }
  return response;
}