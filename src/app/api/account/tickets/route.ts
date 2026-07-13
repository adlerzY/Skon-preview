import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

const TICKETS_QUERY = `
  query GetMyTickets($after: String) {
    supportTickets(first: 20, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        databaseId
        title
        date
        ticketStatus
        linkedOrderId
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
  const data = await fetchGraphQL(TICKETS_QUERY, { after }, [], "no-store", token);

  return NextResponse.json({
    tickets: data?.supportTickets?.nodes ?? [],
    pageInfo: data?.supportTickets?.pageInfo ?? { hasNextPage: false, endCursor: null },
  });
}