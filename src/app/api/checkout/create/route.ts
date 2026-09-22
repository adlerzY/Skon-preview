import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { SUBMIT_CUSTOMER_ORDER_MUTATION, TOUCH_SESSION_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE, SESSION_ID_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { MAX_CART_QUANTITY } from "@/lib/cartLimits";
import { readJsonBody, requestBodyErrorResponse } from "@/lib/requestBody";

interface CheckoutCartItem {
  productId: number;
  variationId?: number;
  quantity?: number;
  deliveryMethod: string;
  region?: string;
  variationName?: string;
  customFields?: { email?: string; battleTag?: string; password?: string;};
}

function errorResponse(code: string, error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, code, error, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`checkout:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 }))) {
    const response = errorResponse("RATE_LIMITED", "تعداد درخواست بیش از حد مجاز است", 429, { retryAfter: 600 });
    response.headers.set("Retry-After", "600");
    return response;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;

  if (!token) return errorResponse("AUTH_REQUIRED", "برای تکمیل خرید باید وارد حساب کاربری خود شوید", 401);
  if (!sessionId) return errorResponse("SESSION_INVALID", "نشست شما معتبر نیست؛ دوباره وارد شوید", 401);
  if (request.headers.get("x-a2b-session-refresh-failed") === "1") {
    return errorResponse("SESSION_REFRESH_FAILED", "نشست شما قابل تمدید نیست؛ دوباره وارد شوید", 401);
  }

  try {
    const sessionPreflight = await fetchGraphQLWithErrors(
      TOUCH_SESSION_MUTATION,
      { sessionId },
      token,
      sessionId,
    );
    if (sessionPreflight.data?.touchSession?.success !== true) {
      return errorResponse("SESSION_INVALID", "نشست شما معتبر نیست؛ دوباره وارد شوید", 401);
    }
    const body = await readJsonBody(request, 64 * 1024);
    const items: CheckoutCartItem[] = Array.isArray(body?.items) ? body.items : [];
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    if (!/^[A-Za-z0-9._:-]{8,100}$/.test(idempotencyKey)) {
      return errorResponse("VALIDATION_ERROR", "شناسه یکتای سفارش نامعتبر است", 400);
    }

    if (items.length === 0 || items.length > 10) {
      return errorResponse("VALIDATION_ERROR", "تعداد اقلام سبد خرید نامعتبر است", 400);
    }

    let totalQuantity = 0;

    for (const item of items) {
      if (!Number.isInteger(item.productId) || item.productId <= 0) {
        return errorResponse("VALIDATION_ERROR", "شناسه محصول نامعتبر است", 400);
      }
      if (item.variationId != null && (!Number.isInteger(item.variationId) || item.variationId <= 0)) {
        return errorResponse("VALIDATION_ERROR", "شناسه ویژگی محصول نامعتبر است", 400);
      }
      if (item.quantity != null && (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
        return errorResponse("VALIDATION_ERROR", "تعداد نامعتبر است", 400);
      }
      totalQuantity += item.quantity || 1;
    }

    if (totalQuantity > MAX_CART_QUANTITY) {
      return errorResponse("VALIDATION_ERROR", `سقف خرید ${MAX_CART_QUANTITY} عدد می‌باشد`, 400);
    }

    const lineItems = items.map((item) => ({
      productId: item.productId,
      variationId: item.variationId || undefined,
      quantity: item.quantity || 1,
      metaData: [
        { key: "روش تحویل", value: item.deliveryMethod },
        ...(item.region ? [{ key: "ریجن", value: item.region }] : []),
        ...(item.variationName ? [{ key: "ویژگی", value: item.variationName }] : []),
        ...(item.customFields?.email ? [{ key: "_secure_email", value: item.customFields.email }] : []),
        ...(item.customFields?.password ? [{ key: "_secure_password", value: item.customFields.password }] : []),
        ...(item.customFields?.battleTag ? [{ key: "_secure_battletag", value: item.customFields.battleTag }] : []),
      ],
    }));

    const { data, errorMessage } = await fetchGraphQLWithErrors(
      SUBMIT_CUSTOMER_ORDER_MUTATION,
      { lineItems, customerNote: "ثبت‌شده از فروشگاه Arena2Battle", idempotencyKey },
      token
    );

    const order = data?.submitCustomerOrder?.order;

    if (!order?.databaseId || !order?.orderKey) {
      const raw = String(errorMessage || "");
      const lowered = raw.toLowerCase();
      if (lowered.includes("btl_session_denied") || lowered.includes("session")) {
        return errorResponse("SESSION_INVALID", "نشست شما معتبر نیست؛ دوباره وارد شوید", 401);
      }
      if (lowered.includes("موجودی") || lowered.includes("stock") || lowered.includes("cd key")) {
        return errorResponse("OUT_OF_STOCK", "موجودی یکی از اقلام کافی نیست؛ سبد را دوباره بررسی کنید", 409);
      }
      if (lowered.includes("قیمت") || lowered.includes("price")) {
        return errorResponse("PRICE_CHANGED", "قیمت یکی از اقلام تغییر کرده است؛ سبد را دوباره بررسی کنید", 409);
      }
      return errorResponse("INTERNAL_ERROR", "ایجاد سفارش با خطا مواجه شد. لطفاً دوباره تلاش کنید", 500);
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
    const fallbackUrl = `${siteUrl}/checkout/order-pay/${order.databaseId}/?pay_for_order=true&key=${order.orderKey}`;
    const redirectUrl = order.paymentUrl || fallbackUrl;

    return NextResponse.json({ ok: true, success: true, code: "ORDER_CREATED", redirectUrl, orderNumber: order.orderNumber });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    console.error("Checkout error:", error);
    return errorResponse("INTERNAL_ERROR", "خطا در ارتباط با سرور", 500);
  }
}
