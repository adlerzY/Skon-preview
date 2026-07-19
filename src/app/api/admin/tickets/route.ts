import { NextResponse } from "next/server";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { ADMIN_OPEN_TICKETS_QUERY } from "@/lib/graphql/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.isStaff) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const token = await getAuthToken();
  const data = await fetchGraphQL(ADMIN_OPEN_TICKETS_QUERY, { first: 10 }, [], "no-store", token || undefined);

  return NextResponse.json({ tickets: data?.adminOpenTickets ?? [] });
}