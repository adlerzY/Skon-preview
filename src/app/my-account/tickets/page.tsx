import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import TicketsPaginated from "@/components/account/TicketsPaginated";
import { AccountTicketsLoadingShell } from "@/components/account/AccountPageLoadingShell";

const TICKETS_QUERY = `
  query GetMyTickets($after: String) {
    myTickets(first: 20, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        databaseId
        title
        date
        ticketStatus
        linkedOrderId
        customerName
      }
    }
  }
`;

type TicketsData = Awaited<ReturnType<typeof fetchGraphQL>>;

async function TicketsDataStream({ dataPromise }: { dataPromise: Promise<TicketsData> }) {
  const data = await dataPromise;
  const tickets = data?.myTickets?.nodes ?? [];
  const pageInfo = data?.myTickets?.pageInfo ?? { hasNextPage: false, endCursor: null };
  return <TicketsPaginated initialTickets={tickets} initialPageInfo={pageInfo} />;
}

export default async function TicketsPage() {
  const tokenPromise = getAuthToken();
  const dataPromise = tokenPromise.then((token) =>
    fetchGraphQL(TICKETS_QUERY, {}, [], "no-store", token || undefined)
  );
  const userPromise = getCurrentUser();
  const user = await userPromise;

  if (!user) redirect("/my-account");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">تیکت‌های پشتیبانی</h1>
        <Link href="/my-account/tickets/new" className="bg-brand-blue text-white text-sm font-bold px-4 py-2.5">
          + تیکت جدید
        </Link>
      </div>

      <Suspense fallback={<AccountTicketsLoadingShell />}>
        <TicketsDataStream dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}
