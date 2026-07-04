import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, LOGGED_IN_COOKIE } from "@/lib/auth/constants";

export async function POST() {
  const response = NextResponse.json({ success: true });
  for (const name of [AUTH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, LOGGED_IN_COOKIE]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}