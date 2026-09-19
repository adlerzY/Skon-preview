import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { UPDATE_AVATAR_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getJwtDatabaseId } from "@/lib/auth/jwt";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidAvatarId, resolveAvatarUrl } from "@/lib/avatars";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`avatar-ip:${ip}`, { max: 30, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const jwtDatabaseId = getJwtDatabaseId(token);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const userRateLimitId = jwtDatabaseId ?? user.databaseId;
  if (!(await checkRateLimit(`avatar-user:${userRateLimitId}`, { max: 10, windowMs: 10 * 60 * 1000 }))) {
    return NextResponse.json({ error: "تعداد تغییر عکس پروفایل بیش از حد مجاز است" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const avatarId = typeof body?.avatarId === "string" ? body.avatarId.trim() : "";

    const isValid = await isValidAvatarId(avatarId, user.isStaff);
    if (!isValid) {
      return NextResponse.json({ error: "آواتار انتخاب‌شده نامعتبر است" }, { status: 400 });
    }

    const data = await fetchGraphQL(UPDATE_AVATAR_MUTATION, { avatarUrl: avatarId }, [], "no-store", token);
    const result = data?.updateUserAvatar;

    if (!result?.success) {
      return NextResponse.json({ error: "بروزرسانی عکس پروفایل با خطا مواجه شد" }, { status: 500 });
    }

    const resolvedUrl = await resolveAvatarUrl(result.avatarUrl);

    return NextResponse.json({ success: true, avatarId: result.avatarUrl, avatarUrl: resolvedUrl });
  } catch (error) {
    console.error("Update avatar error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}