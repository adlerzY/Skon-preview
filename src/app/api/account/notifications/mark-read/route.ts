import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

export async function POST() {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  await fetchGraphQL(`mutation { markNotificationsRead(input: {}) { success } }`, {}, [], "no-store", token);
  return NextResponse.json({ success: true });
}