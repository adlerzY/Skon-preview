import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQLWithErrors } from "@/lib/graphql/rawFetch";
import { REVALIDATE_CUSTOMER_CART_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { MAX_CART_QUANTITY } from "@/lib/cartLimits";
import { readJsonBody, requestBodyErrorResponse } from "@/lib/requestBody";

interface CartItem {
  productId: number;
  variationId?: number;
  quantity?: number;
  price?: number;
  deliveryMethod: string;
  region?: string;
  variationName?: string;
  customFields?: { email?: string; battleTag?: string; password?: string };
}

function errorResponse(code: string, error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, code, error, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return errorResponse("AUTH_REQUIRED", "برای ادامه باید وارد حساب کاربری خود شوید", 401);
  if (request.headers.get("x-a2b-session-refresh-failed") === "1") {
    return errorResponse("SESSION_REFRESH_FAILED", "نشست شما قابل تمدید نیست؛ دوباره وارد شوید", 401);
  }

  try {
    const body = await readJsonBody(request, 64 * 1024);
    const items: CartItem[] = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return errorResponse("VALIDATION_ERROR", "سبد خرید شما خالی است", 400);

    if (items.length > 10) return errorResponse("VALIDATION_ERROR", "تعداد اقلام سبد خرید نامعتبر است", 400);

    let totalQuantity = 0;
    for (const item of items) {
      if (!Number.isInteger(item.productId) || item.productId <= 0) return errorResponse("VALIDATION_ERROR", "شناسه محصول نامعتبر است", 400);
      if (item.variationId != null && (!Number.isInteger(item.variationId) || item.variationId <= 0)) return errorResponse("VALIDATION_ERROR", "شناسه ویژگی محصول نامعتبر است", 400);
      if (item.quantity != null && (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) return errorResponse("VALIDATION_ERROR", "تعداد نامعتبر است", 400);
      totalQuantity += item.quantity || 1;
    }
    if (totalQuantity > MAX_CART_QUANTITY) return errorResponse("VALIDATION_ERROR", `سقف خرید ${MAX_CART_QUANTITY} عدد می‌باشد`, 400);

    const lineItems = items.map((item) => ({
      productId: item.productId,
      variationId: item.variationId || undefined,
      quantity: item.quantity || 1,
      clientPrice: Number.isFinite(Number(item.price)) ? Number(item.price) : undefined,
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
      REVALIDATE_CUSTOMER_CART_MUTATION,
      { lineItems },
      token,
    );
    const result = data?.revalidateCustomerCart?.result;
    if (!result) {
      const sessionError = errorMessage?.toLowerCase().includes("btl_session_denied") || errorMessage?.toLowerCase().includes("session");
      return errorResponse(
        sessionError ? "SESSION_INVALID" : "INTERNAL_ERROR",
        sessionError ? "نشست شما معتبر نیست؛ دوباره وارد شوید" : "بررسی سبد خرید انجام نشد؛ لطفاً دوباره تلاش کنید",
        sessionError ? 401 : 500,
      );
    }

    if (!result.valid) {
      return NextResponse.json({
        ok: false,
        code: result.code || (result.changed ? "PRICE_CHANGED" : "CART_INVALID"),
        error: result.message || "یک یا چند مورد از سبد خرید نیازمند بررسی است",
        changed: Boolean(result.changed),
        items: Array.isArray(result.items) ? result.items : [],
      }, { status: result.code === "SESSION_INVALID" ? 401 : 409 });
    }

    return NextResponse.json({
      ok: true,
      code: "CART_VALID",
      changed: Boolean(result.changed),
      items: Array.isArray(result.items) ? result.items : [],
    }, { status: 200 });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    console.error("Cart revalidation error:", error);
    return errorResponse("INTERNAL_ERROR", "خطا در بررسی سبد خرید", 500);
  }
}
