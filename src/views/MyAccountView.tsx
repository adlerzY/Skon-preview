import { getCurrentUser, getAuthToken } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { DASHBOARD_SUMMARY_QUERY, ADMIN_DASHBOARD_SUMMARY_QUERY, ADMIN_OPEN_TICKETS_QUERY } from "@/lib/graphql/auth";
import LoginForm from "@/components/account/LoginForm";
import AccountDashboard from "@/components/account/AccountDashboard";
import AdminDashboard from "@/components/account/AdminDashboard";

const SUCCESSFUL_STATUSES = ["PROCESSING", "COMPLETED"];

export default async function MyAccountView() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <LoginForm />
      </div>
    );
  }

  const token = await getAuthToken();

  if (user.isStaff) {
    const [summaryData, ticketsData] = await Promise.all([
      fetchGraphQL(ADMIN_DASHBOARD_SUMMARY_QUERY, {}, [], "no-store", token || undefined),
      fetchGraphQL(ADMIN_OPEN_TICKETS_QUERY, { first: 10 }, [], "no-store", token || undefined),
    ]);

    const siteUrl = (process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "").replace("/graphql", "");

    return (
      <div className="mx-auto h-full">
        <AdminDashboard
          user={user}
          openTicketsCount={summaryData?.adminOpenTicketsCount ?? 0}
          pendingReviewsCount={summaryData?.pendingReviewsCount ?? 0}
          initialOpenTickets={ticketsData?.adminOpenTickets ?? []}
          wpAdminUrl={siteUrl || null}
        />
      </div>
    );
  }

  const data = await fetchGraphQL(DASHBOARD_SUMMARY_QUERY, {}, [], "no-store", token || undefined);

  const allOrders = data?.customer?.orders?.nodes ?? [];
  const successfulOrders = allOrders.filter((o: any) => SUCCESSFUL_STATUSES.includes(o.status));
  const wishlistIds = data?.viewer?.wishlistIds ?? [];
  const tickets = data?.myTickets?.nodes ?? [];
  const openTickets = tickets.filter((t: any) => (t.ticketStatus ?? "open") !== "closed");
  const reviewsCount = data?.myReviews?.totalCount ?? 0;

  return (
    <div className=" mx-auto h-full">
      <AccountDashboard
        user={user}
        recentOrders={allOrders.slice(0, 3)}
        successfulOrdersCount={successfulOrders.length}
        wishlistCount={wishlistIds.length}
        recentTickets={tickets.slice(0, 3)}
        openTicketsCount={openTickets.length}
        reviewsCount={reviewsCount}
      />
    </div>
  );
}