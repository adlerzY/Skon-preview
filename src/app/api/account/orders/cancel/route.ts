import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { CANCEL_MY_ORDER_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getJwtDatabaseId } from "@/lib/auth/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { readJsonBody, requestBodyErrorResponse } from "@/lib/requestBody";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`order-cancel-ip:${ip}`, { max: 40, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429, headers: NO_STORE });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401, headers: NO_STORE });
  }

  const userId = getJwtDatabaseId(token);
  if (userId && !(await checkRateLimit(`order-cancel-user:${userId}`, { max: 10, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429, headers: NO_STORE });
  }

  try {
    const body = await readJsonBody(request, 4 * 1024);
    const orderId = Number(body?.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400, headers: NO_STORE });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(CANCEL_MY_ORDER_MUTATION, { orderId }, token);

    if (!data?.cancelMyOrder?.success) {
      const raw = String(errorMessage ?? "");
      if (raw.toLowerCase().includes("btl_session_denied")) {
        return NextResponse.json({ error: "نشست شما معتبر نیست؛ دوباره وارد شوید" }, { status: 401, headers: NO_STORE });
      }
      const message = raw && raw.length <= 220 && /[\u0600-\u06FF]/.test(raw) ? raw : "لغو سفارش انجام نشد";
      return NextResponse.json({ error: message }, { status: 409, headers: NO_STORE });
    }

    return NextResponse.json({ ok: true, status: data.cancelMyOrder.status }, { headers: NO_STORE });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500, headers: NO_STORE });
  }
}