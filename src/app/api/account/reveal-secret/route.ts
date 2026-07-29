import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const REVEAL_MUTATION = `
  mutation RevealOrderSecret($orderId: Int!, $itemId: Int!, $fieldType: String!) {
    revealOrderSecret(input: { orderId: $orderId, itemId: $itemId, fieldType: $fieldType }) {
      values
    }
  }
`;

const ALLOWED_FIELDS = ["cdkey", "email", "password", "battletag"];

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`reveal:${ip}`, { max: 20, windowMs: 5 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });

  try {
    const body = await request.json();
    const orderId = Number(body?.orderId);
    const itemId = Number(body?.itemId);
    const fieldTypes: string[] = Array.isArray(body?.fieldTypes) ? body.fieldTypes : ["cdkey"];

    if (!Number.isInteger(orderId) || !Number.isInteger(itemId)) {
      return NextResponse.json({ error: "پارامتر نامعتبر" }, { status: 400 });
    }
    if (fieldTypes.some((f) => !ALLOWED_FIELDS.includes(f))) {
      return NextResponse.json({ error: "پارامتر نامعتبر" }, { status: 400 });
    }

    if (fieldTypes.includes("cdkey")) {
      const data = await fetchGraphQL(REVEAL_MUTATION, { orderId, itemId, fieldType: "cdkey" }, [], "no-store", token);
      const values = data?.revealOrderSecret?.values;
      if (!Array.isArray(values) || values.length === 0) {
        return NextResponse.json({ error: "کد یافت نشد یا سفارش تکمیل نشده" }, { status: 404 });
      }
      return NextResponse.json({ values });
    }

    const fields: Record<string, string> = {};
    for (const fieldType of fieldTypes) {
      const data = await fetchGraphQL(REVEAL_MUTATION, { orderId, itemId, fieldType }, [], "no-store", token);
      const value = data?.revealOrderSecret?.values?.[0];
      if (typeof value === "string") {
        fields[fieldType] = value;
      }
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "اطلاعاتی یافت نشد (شاید سفارش تکمیل/لغو شده و اطلاعات پاک شده باشد)" }, { status: 404 });
    }

    return NextResponse.json({ fields });
  } catch (error) {
    console.error("Reveal secret error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}