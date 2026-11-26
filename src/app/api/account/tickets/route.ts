import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

const NO_STORE = { "Cache-Control": "private, no-store" };

const TICKETS_QUERY = `
  query GetMyTickets($after: String, $search: String, $status: String) {
    myTickets(first: 20, after: $after, search: $search, status: $status) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        databaseId
        title
        date
        ticketStatus
        linkedOrderId
        customerName
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401, headers: NO_STORE });
  }

  const after = request.nextUrl.searchParams.get("after") || undefined;
  const search = (request.nextUrl.searchParams.get("search") || "").trim().slice(0, 100) || undefined;
  const status = request.nextUrl.searchParams.get("status") || undefined;

  const data = await fetchGraphQL(TICKETS_QUERY, { after, search, status }, [], "no-store", token);

  if (!data?.myTickets) {
    return NextResponse.json({ error: "دریافت تیکت‌ها انجام نشد" }, { status: 502, headers: NO_STORE });
  }

  return NextResponse.json(
    {
      tickets: data.myTickets.nodes ?? [],
      pageInfo: data.myTickets.pageInfo ?? { hasNextPage: false, endCursor: null },
    },
    { headers: NO_STORE }
  );
}