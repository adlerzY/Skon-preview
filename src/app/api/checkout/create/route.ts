import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { CREATE_ORDER_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

interface CheckoutCartItem {
  productId: number;
  variationId?: number;
  quantity?: number;
  deliveryMethod: string;
  region?: string;
  variationName?: string;
  customFields?: { email?: string; battleTag?: string };
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "برای تکمیل خرید باید وارد حساب کاربری خود شوید" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const items: CheckoutCartItem[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "سبد خرید شما خالی است" }, { status: 400 });
    }

    // نکته: هر آیتم متادیتای سفارشی (روش تحویل، ریجن، بتل‌تگ، ایمیل) دارد که فیلد
    // استاندارد ووکامرس نیست. اینجا به‌صورت metaData روی هر لاین‌آیتم فرستاده می‌شود؛
    // ساختار دقیق LineItemInput.metaData را در GraphiQL IDE وردپرس‌تان verify کنید
    // (ممکن است بین نسخه‌های WooGraphQL کمی فرق داشته باشد).
    const lineItems = items.map((item) => ({
      productId: item.productId,
      variationId: item.variationId || undefined,
      quantity: item.quantity || 1,
      metaData: [
        { key: "روش تحویل", value: item.deliveryMethod },
        ...(item.region ? [{ key: "ریجن", value: item.region }] : []),
        ...(item.variationName ? [{ key: "ویژگی", value: item.variationName }] : []),
        ...(item.customFields?.email ? [{ key: "ایمیل اکانت", value: item.customFields.email }] : []),
        ...(item.customFields?.battleTag ? [{ key: "بتل‌تگ", value: item.customFields.battleTag }] : []),
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

    // هدایت کاربر به صفحه‌ی پرداخت بومی ووکامرس (order-pay) — همان درگاه‌های فعال
    // (مثل زرین‌پال) را نشان می‌دهد؛ نیازی به پیاده‌سازی مجدد درگاه در Next.js نیست.
    const siteUrl = (process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "").replace("/graphql", "");
    const redirectUrl = `${siteUrl}/checkout/order-pay/${order.databaseId}/?pay_for_order=true&key=${order.orderKey}`;

    return NextResponse.json({ success: true, redirectUrl, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}