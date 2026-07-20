import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { REFRESH_TOKEN_MUTATION, TOUCH_SESSION_MUTATION } from "@/lib/graphql/auth";
import { 
  AUTH_TOKEN_COOKIE, 
  REFRESH_TOKEN_COOKIE, 
  SESSION_ID_COOKIE, 
  AUTH_TOKEN_MAX_AGE 
} from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`auth-refresh:${ip}`, { max: 20, windowMs: 5 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "نشست شما منقضی شده، دوباره وارد شوید" }, 
      { status: 401 }
    );
  }

  try {
    const data = await fetchGraphQL(REFRESH_TOKEN_MUTATION, { refreshToken }, [], "no-store");
    const newToken = data?.refreshJwtAuthToken?.authToken;

    if (!newToken) {
      return NextResponse.json(
        { error: "امکان تمدید نشست وجود ندارد" }, 
        { status: 401 }
      );
    }

    if (sessionId) {
      await fetchGraphQL(TOUCH_SESSION_MUTATION, { sessionId }, [], "no-store", newToken);
    }

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({ success: true });

    response.cookies.set(AUTH_TOKEN_COOKIE, newToken, {
      httpOnly: true, 
      secure: isProd, 
      sameSite: "lax", 
      path: "/", 
      maxAge: AUTH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "خطا در ارتباط با سرور" }, 
      { status: 500 }
    );
  }
}