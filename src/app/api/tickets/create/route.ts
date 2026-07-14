import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { CREATE_SUPPORT_TICKET_MUTATION } from "@/lib/graphql/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`ticket:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const linkedOrderId = Number.isInteger(body?.linkedOrderId) ? body.linkedOrderId : undefined;

    if (title.length < 3) {
      return NextResponse.json({ error: "عنوان تیکت خیلی کوتاه است" }, { status: 400 });
    }
    if (content.length < 5) {
      return NextResponse.json({ error: "متن تیکت خیلی کوتاه است" }, { status: 400 });
    }

    const data = await fetchGraphQL(
      CREATE_SUPPORT_TICKET_MUTATION,
      { title, content, linkedOrderId },
      [],
      "no-store",
      token
    );

    const ticketId = data?.submitSupportTicket?.ticketId;
    if (!ticketId) {
      return NextResponse.json({ error: "ثبت تیکت با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticketId });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}