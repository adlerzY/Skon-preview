import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchGraphQL } from "@/lib/graphql";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const REPLY_MUTATION = `
  mutation ReplyToSupportTicket($ticketId: Int!, $content: String!) {
    replyToSupportTicket(input: { ticketId: $ticketId, content: $content }) {
      success
      ticketStatus
    }
  }
`;

export async function POST(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`ticket-reply:${ip}`, { max: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "تعداد درخواست بیش از حد مجاز است" }, { status: 429 });
  }

  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "ابتدا وارد حساب کاربری شوید" }, { status: 401 });
  }

  const { ticketId } = await params;
  const idNum = Number(ticketId);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "شناسه تیکت نامعتبر است" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (content.length < 2) {
      return NextResponse.json({ error: "متن پاسخ خیلی کوتاه است" }, { status: 400 });
    }

    const data = await fetchGraphQL(REPLY_MUTATION, { ticketId: idNum, content }, [], "no-store", token);
    if (!data?.replyToSupportTicket?.success) {
      return NextResponse.json({ error: "ثبت پاسخ با خطا مواجه شد" }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticketStatus: data.replyToSupportTicket.ticketStatus });
  } catch (error) {
    console.error("Ticket reply error:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور" }, { status: 500 });
  }
}