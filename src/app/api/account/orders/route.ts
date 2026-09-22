import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { CUSTOMER_ORDERS_QUERY } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

const ALL_STATUSES = ["PENDING", "PROCESSING", "ON_HOLD", "COMPLETED", "CANCELLED", "REFUNDED", "FAILED"];
const RECENT_CANCELLED_WINDOW_MS = 24 * 60 * 60 * 1000;

function keepVisibleOrder(order: { status?: string; date?: string; cancelledAt?: string }): boolean {
  if (!["CANCELLED", "FAILED"].includes(String(order.status))) return true;
  const cancelledAt = order.cancelledAt ? new Date(order.cancelledAt).getTime() : 0;
  return cancelledAt > 0 && Date.now() - cancelledAt <= RECENT_CANCELLED_WINDOW_MS;
}

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const after = request.nextUrl.searchParams.get("after") || undefined;
  const statusParam = request.nextUrl.searchParams.get("status");
  const statuses = statusParam && statusParam !== "ALL" ? [statusParam] : ALL_STATUSES;

  const data = await fetchGraphQL(CUSTOMER_ORDERS_QUERY, { after, statuses }, [], "no-store", token);

  return NextResponse.json({
    orders: (data?.customer?.orders?.nodes ?? []).filter(keepVisibleOrder),
    pageInfo: data?.customer?.orders?.pageInfo ?? { hasNextPage: false, endCursor: null },
    downloadableItems: data?.customer?.downloadableItems?.nodes ?? [],
  });
}