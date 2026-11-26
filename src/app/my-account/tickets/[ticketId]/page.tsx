import { notFound, redirect } from "next/navigation";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import TicketDetailView from "@/components/account/TicketDetailView";

const TICKET_QUERY = `
  query GetMyTicket($id: Int!) {
    myTicket(id: $id) {
      databaseId
      title
      content
      date
      ticketStatus
      linkedOrderId
      replies {
        id
        authorRole
        authorName
        content
        createdAt
      }
    }
  }
`;

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const idNum = Number(ticketId);
  if (!Number.isInteger(idNum) || idNum <= 0) notFound();

  const token = await getAuthToken();
  const dataPromise = fetchGraphQL(TICKET_QUERY, { id: idNum }, [], "no-store", token || undefined);
  const [user, data] = await Promise.all([getCurrentUser(), dataPromise]);
  if (!user) redirect("/my-account");

  const ticket = data?.myTicket;
  if (!ticket) notFound();

  return (
    <TicketDetailView
      userName={user.name}
      ticket={{
        databaseId: ticket.databaseId,
        title: ticket.title,
        content: stripHtml(ticket.content || ""),
        date: ticket.date ?? null,
        ticketStatus: ticket.ticketStatus ?? "open",
        linkedOrderId: ticket.linkedOrderId ?? null,
        replies: ticket.replies ?? [],
      }}
    />
  );
}