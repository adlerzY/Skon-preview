import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { UPDATE_PROFILE_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`profile:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim().slice(0, 60) : undefined;
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim().slice(0, 60) : undefined;
    const email = typeof body?.email === "string" ? body.email.trim().slice(0, 120) : undefined;

    const data = await fetchGraphQL(UPDATE_PROFILE_MUTATION, { firstName, lastName, email }, [], "no-store", token);
    const result = data?.updateCustomerProfile;

    if (!result?.success) {
      return NextResponse.json({ error: "بروزرسانی اطلاعات با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, name: result.name, email: result.email });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}