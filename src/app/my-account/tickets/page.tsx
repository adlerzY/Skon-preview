import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import TicketsPaginated from "@/components/account/TicketsPaginated";

export const dynamic = "force-dynamic";

const TICKETS_QUERY = `
  query GetMyTickets($after: String) {
    supportTickets(first: 20, after: $after) {
      pageInfo { hasNextPage endCursor }
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
  const tickets = data?.supportTickets?.nodes ?? [];
  const pageInfo = data?.supportTickets?.pageInfo ?? { hasNextPage: false, endCursor: null };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">تیکت‌های پشتیبانی</h1>
        <Link href="/my-account/tickets/new" className="bg-brand-blue text-white text-sm font-bold px-4 py-2.5">
          + تیکت جدید
        </Link>
      </div>

      <TicketsPaginated initialTickets={tickets} initialPageInfo={pageInfo} />
    </div>
  );
}