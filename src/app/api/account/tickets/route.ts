import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

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
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const after = request.nextUrl.searchParams.get("after") || undefined;
  const search = request.nextUrl.searchParams.get("search") || undefined;
  const status = request.nextUrl.searchParams.get("status") || undefined;

  const data = await fetchGraphQL(TICKETS_QUERY, { after, search, status }, [], "no-store", token);

  return NextResponse.json({
    tickets: data?.myTickets?.nodes ?? [],
    pageInfo: data?.myTickets?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}