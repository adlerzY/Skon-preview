import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { CUSTOMER_ORDERS_QUERY } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { keepVisibleOrder } from "@/lib/orderVisibility";

const ALL_STATUSES = ["PENDING", "PROCESSING", "ON_HOLD", "COMPLETED", "CANCELLED", "REFUNDED", "FAILED"];
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401, headers: NO_STORE });
  }

  const after = request.nextUrl.searchParams.get("after") || undefined;
  const statusParam = request.nextUrl.searchParams.get("status") || "ALL";
  const statuses = ALL_STATUSES.includes(statusParam) ? [statusParam] : ALL_STATUSES;

  const data = await fetchGraphQL(CUSTOMER_ORDERS_QUERY, { after, statuses }, [], "no-store", token);

  if (!data?.customer) {
    return NextResponse.json({ error: "دریافت سفارش‌ها انجام نشد" }, { status: 502, headers: NO_STORE });
  }

  return NextResponse.json(
    {
      orders: (data.customer.orders?.nodes ?? []).filter(keepVisibleOrder),
      pageInfo: data.customer.orders?.pageInfo ?? { hasNextPage: false, endCursor: null },
      downloadableItems: data.customer.downloadableItems?.nodes ?? [],
    },
    { headers: NO_STORE }
  );
}