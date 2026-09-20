import { ComponentProps } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getAuthToken } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import {
  DASHBOARD_SUMMARY_QUERY,
} from "@/lib/graphql/auth";
import UnifiedLoginFlow from "@/components/account/UnifiedLoginFlow";
import AccountDashboard from "@/components/account/AccountDashboard";

const SUCCESSFUL_STATUSES = new Set(["PROCESSING", "COMPLETED"]);

type AccountDashboardProps = ComponentProps<typeof AccountDashboard>;
type OrderSummary = AccountDashboardProps["recentOrders"][number];
type TicketSummary = AccountDashboardProps["recentTickets"][number];


export default async function MyAccountView() {
  const userPromise = getCurrentUser();
  const tokenPromise = getAuthToken();
  const dataPromise = tokenPromise
    .then((token) => fetchGraphQL(DASHBOARD_SUMMARY_QUERY, {}, [], "no-store", token || undefined))
    .catch(() => null);

  const [user, dataResult] = await Promise.all([userPromise, dataPromise]);

  if (!user) {
    return <UnifiedLoginFlow />;
  }

  if (user.isStaff) {
    redirect("/admin");
  }

  const data = dataResult;

  const allOrders: OrderSummary[] = data?.customer?.orders?.nodes ?? [];
  const successfulOrdersCount = allOrders.filter(
    (o) => typeof o.status === "string" && SUCCESSFUL_STATUSES.has(o.status)
  ).length;
  const tickets: TicketSummary[] = data?.myTickets?.nodes ?? [];
  const openTicketsCount = tickets.filter(
    (t) => (t.ticketStatus ?? "open") !== "closed"
  ).length;
  const reviewsCount: number = data?.myReviews?.totalCount ?? 0;

  return (
    <div className="mx-auto h-full">
      <AccountDashboard
        user={user}
        recentOrders={allOrders.slice(0, 3)}
        successfulOrdersCount={successfulOrdersCount}
        recentTickets={tickets.slice(0, 3)}
        openTicketsCount={openTicketsCount}
        reviewsCount={reviewsCount}
      />
    </div>
  );
}
