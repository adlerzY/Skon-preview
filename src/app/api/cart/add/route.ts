import { NextRequest, NextResponse } from "next/server";

// ✅ validation helper
function isPositiveInt(val: unknown): val is number {
  return typeof val === "number" && Number.isInteger(val) && val > 0;
}

const ALLOWED_METHODS = ["direct", "gift", "code"] as const;
type DeliveryMethod = typeof ALLOWED_METHODS[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variationId, method, customFields } = body;

    // ✅ validation — همه فیلدها چک میشن قبل از forward
    if (!isPositiveInt(productId)) {
      return NextResponse.json({ error: "productId نامعتبر است" }, { status: 400 });
    }

    if (variationId !== undefined && !isPositiveInt(variationId)) {
      return NextResponse.json({ error: "variationId نامعتبر است" }, { status: 400 });
    }

    if (!ALLOWED_METHODS.includes(method as DeliveryMethod)) {
      return NextResponse.json({ error: "روش تحویل نامعتبر است" }, { status: 400 });
    }

    // ✅ sanitize customFields — فقط فیلدهای مجاز
    const safeCustomFields: Record<string, string> = {};
    if (customFields && typeof customFields === "object") {
      const { battleTag, email, password } = customFields as Record<string, unknown>;
      if (typeof battleTag === "string") safeCustomFields.battleTag = battleTag.slice(0, 100);
      if (typeof email === "string") safeCustomFields.email = email.slice(0, 254);
      if (typeof password === "string") safeCustomFields.password = password.slice(0, 128);
    }

    const backendUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace('/graphql', '') || '';
    const cartEndpoint = `${backendUrl}/wp-json/wc/store/v1/cart/add-item`;

    const payload = {
      id: productId,
      quantity: 1,
      variation: variationId ? [{ id: variationId }] : [],
      delivery_method: method,
      battle_tag: safeCustomFields.battleTag,
      account_email: safeCustomFields.email,
      account_password: safeCustomFields.password,
    };

    const response = await fetch(cartEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "خطا در ارتباط با سبد خرید فروشگاه", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, cart: data }, { status: 200 });

  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
