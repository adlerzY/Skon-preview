import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const TICKET_QUERY = `
  query GetMyTicket($id: Int!) {
    myTicket(id: $id) {
      databaseId
      title
      content
      date
      ticketStatus
      linkedOrderId
    }
  }
`;

const STATUS_TONE: Record<string, "blue" | "sabz" | "zard" | "red" | "neutral"> = {
  open: "zard",
  answered: "blue",
  closed: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  open: "باز",
  answered: "پاسخ داده‌شده",
  closed: "بسته‌شده",
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  const idNum = Number(ticketId);
  if (!Number.isInteger(idNum) || idNum <= 0) notFound();

  const token = await getAuthToken();
  const data = await fetchGraphQL(TICKET_QUERY, { id: idNum }, [], "no-store", token || undefined);
  const ticket = data?.myTicket;

  if (!ticket) notFound();

  const status = ticket.ticketStatus ?? "open";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link
        href="/my-account/tickets"
        className="inline-flex items-center gap-1 text-sm text-brand-m_khonsa hover:text-white transition-colors"
      >
        <ChevronRight size={16} />
        بازگشت به تیکت‌ها
      </Link>

      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-surface_hover pb-4">
          <h1 className="text-lg font-black text-white">{ticket.title}</h1>
          <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-brand-m_khonsa">
          {ticket.date && <span>تاریخ ثبت: {new Date(ticket.date).toLocaleDateString("fa-IR")}</span>}
          {ticket.linkedOrderId && <span>سفارش مرتبط: #{ticket.linkedOrderId}</span>}
        </div>

        <p className="text-sm text-brand-active leading-8 whitespace-pre-wrap">
          {stripHtml(ticket.content || "")}
        </p>
      </Card>

      <div className="text-xs text-brand-m_khonsa bg-brand-surface border border-brand-surface_hover p-4">
        پاسخ پشتیبانی به‌زودی از طریق همین صفحه یا ایمیل شما ارسال می‌شود.
      </div>
    </div>
  );
}