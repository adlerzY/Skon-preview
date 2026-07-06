import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

const QUERY = `query { viewer { notifications(first: 20) { id title body link isRead createdAt } } }`;

export async function GET() {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ notifications: [] });
  const data = await fetchGraphQL(QUERY, {}, [], "no-store", token);
  return NextResponse.json({ notifications: data?.viewer?.notifications ?? [] });
}