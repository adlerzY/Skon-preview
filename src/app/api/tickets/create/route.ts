import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { CREATE_ORDER_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

interface CheckoutCartItem {
  productId: number;
  variationId?: number;
  quantity?: number;
  deliveryMethod: string;
  region?: string;
  variationName?: string;
  customFields?: { email?: string; battleTag?: string; password?: string;};
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`checkout:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "تعداد درخواست بیش از حد مجاز است" },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { error: "برای تکمیل خرید باید وارد حساب کاربری خود شوید" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const items: CheckoutCartItem[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "سبد خرید شما خالی است" }, { status: 400 });
    }

    for (const item of items) {
      if (!Number.isInteger(item.productId) || item.productId <= 0) {
        return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
      }
      if (item.variationId != null && (!Number.isInteger(item.variationId) || item.variationId <= 0)) {
        return NextResponse.json({ error: "شناسه ویژگی محصول نامعتبر است" }, { status: 400 });
      }
      if (item.quantity != null && (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
        return NextResponse.json({ error: "تعداد نامعتبر است" }, { status: 400 });
      }
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

    const data = await fetchGraphQL(
      CREATE_ORDER_MUTATION,
      { lineItems, customerNote: "ثبت‌شده از فروشگاه Arena2Battle" },
      [],
      "no-store",
      token
    );

    const order = data?.createOrder?.order;

    if (!order?.databaseId || !order?.orderKey) {
      return NextResponse.json(
        { error: "ایجاد سفارش با خطا مواجه شد. لطفاً دوباره تلاش کنید" },
        { status: 500 }
      );
    }

    const siteUrl = (process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "").replace("/graphql", "");
    const fallbackUrl = `${siteUrl}/checkout/order-pay/${order.databaseId}/?pay_for_order=true&key=${order.orderKey}`;
    const redirectUrl = order.paymentUrl || fallbackUrl;

    return NextResponse.json({ success: true, redirectUrl, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}