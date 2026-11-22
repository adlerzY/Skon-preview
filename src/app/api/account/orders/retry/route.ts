import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { RETRY_ORDER_PAYMENT_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getJwtDatabaseId } from "@/lib/auth/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { readJsonBody, requestBodyErrorResponse } from "@/lib/requestBody";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`order-retry-ip:${ip}`, { max: 60, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429, headers: NO_STORE });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401, headers: NO_STORE });
  }

  const userId = getJwtDatabaseId(token);
  if (userId && !(await checkRateLimit(`order-retry-user:${userId}`, { max: 12, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد تلاش‌های پرداخت بیش از حد مجاز است. چند دقیقه بعد دوباره امتحان کنید" }, { status: 429, headers: NO_STORE });
  }

  try {
    const body = await readJsonBody(request, 4 * 1024);
    const orderId = Number(body?.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400, headers: NO_STORE });
    }

    const { data, errorMessage } = await fetchGraphQLWithErrors(RETRY_ORDER_PAYMENT_MUTATION, { orderId }, token);
    const result = data?.retryOrderPayment;

    if (!result?.success) {
      const raw = String(errorMessage ?? "");
      if (raw.toLowerCase().includes("btl_session_denied")) {
        return NextResponse.json({ error: "نشست شما معتبر نیست؛ دوباره وارد شوید" }, { status: 401, headers: NO_STORE });
      }
      const message = raw && raw.length <= 220 && /[\u0600-\u06FF]/.test(raw) ? raw : "پرداخت مجدد انجام نشد. لطفاً دوباره تلاش کنید";
      return NextResponse.json({ error: message }, { status: 409, headers: NO_STORE });
    }

    const paymentUrl = typeof result.paymentUrl === "string" ? result.paymentUrl : "";
    if (paymentUrl && !/^https?:\/\//i.test(paymentUrl)) {
      return NextResponse.json({ error: "لینک پرداخت نامعتبر است" }, { status: 502, headers: NO_STORE });
    }

    return NextResponse.json({ ok: true, mode: result.mode, paymentUrl, status: result.status }, { headers: NO_STORE });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    console.error("Retry order payment error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500, headers: NO_STORE });
  }
}