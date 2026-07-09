import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { UPDATE_AVATAR_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`avatar:${ip}`, { max: 20, windowMs: 5 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const avatarPath = typeof body?.avatarPath === "string" ? body.avatarPath.trim() : "";

    if (!avatarPath.startsWith("/avatars/")) {
      return NextResponse.json({ error: "مسیر آواتار نامعتبر است" }, { status: 400 });
    }

    const data = await fetchGraphQL(
      UPDATE_AVATAR_MUTATION,
      { avatarUrl: avatarPath },
      [],
      "no-store",
      token
    );

    if (!data?.updateUserAvatar?.success) {
      return NextResponse.json({ error: "ذخیره‌سازی آواتار با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatarUrl: data.updateUserAvatar.avatarUrl });
  } catch (error) {
    console.error("Update avatar error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}