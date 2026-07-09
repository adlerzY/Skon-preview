import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";

export const dynamic = "force-dynamic";

interface TicketNode {
  id: string;
  databaseId: number;
  title: string;
  date?: string;
  ticketStatus?: string;
  linkedOrderId?: number | null;
}

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

const TICKETS_QUERY = `
  query GetMyTickets {
    supportTickets(first: 50) {
      nodes {
        id
        databaseId
        title
        date
        ticketStatus
        linkedOrderId
      }
    }
  }
`;

export default async function TicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  const token = await getAuthToken();
  const data = await fetchGraphQL(TICKETS_QUERY, {}, [], "no-store", token || undefined);
  const tickets: TicketNode[] = data?.supportTickets?.nodes ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">تیکت‌های پشتیبانی</h1>
        <Link href="/my-account/tickets/new" className="bg-brand-blue text-white text-sm font-bold px-4 py-2.5">
          + تیکت جدید
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-10 text-center text-brand-m_khonsa">
          هنوز هیچ تیکتی ثبت نکرده‌اید.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => {
            const status = ticket.ticketStatus ?? "open";
            return (
              <Link key={ticket.id} href={`/my-account/tickets/${ticket.databaseId}`}>
                <Card className="p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-brand-surface_hover transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-white text-sm">{ticket.title}</span>
                    {ticket.date && (
                      <span className="text-xs text-brand-m_khonsa">
                        {new Date(ticket.date).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {ticket.linkedOrderId && (
                      <span className="text-xs text-brand-m_khonsa">سفارش #{ticket.linkedOrderId}</span>
                    )}
                    <Badge tone={STATUS_TONE[status] ?? "neutral"}>
                      {STATUS_LABEL[status] ?? status}
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}