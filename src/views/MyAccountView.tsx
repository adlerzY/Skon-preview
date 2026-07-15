import { getCurrentUser, getAuthToken } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { DASHBOARD_SUMMARY_QUERY } from "@/lib/graphql/auth";
import LoginForm from "@/components/account/LoginForm";
import AccountDashboard from "@/components/account/AccountDashboard";

const SUCCESSFUL_STATUSES = ["PROCESSING", "COMPLETED"];

export default async function MyAccountView() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="container mx-auto px-4 md:px-6 max-w-2xl py-10 md:py-16 text-brand-active" dir="rtl">
        <LoginForm />
      </main>
    );
  }

  const token = await getAuthToken();
  const data = await fetchGraphQL(DASHBOARD_SUMMARY_QUERY, {}, [], "no-store", token || undefined);

  const allOrders = data?.customer?.orders?.nodes ?? [];
  const successfulOrders = allOrders.filter((o: any) => SUCCESSFUL_STATUSES.includes(o.status));
  const wishlistIds = data?.viewer?.wishlistIds ?? [];
  const tickets = data?.myTickets?.nodes ?? [];
  const openTickets = tickets.filter((t: any) => (t.ticketStatus ?? "open") !== "closed");
  const reviewsCount = data?.myReviews?.totalCount ?? 0;

  return (
    <main className="container mx-auto px-4 md:px-6 max-w-5xl py-10 md:py-16 text-brand-active" dir="rtl">
      <AccountDashboard
        user={user}
        recentOrders={allOrders.slice(0, 3)}
        successfulOrdersCount={successfulOrders.length}
        wishlistCount={wishlistIds.length}
        recentTickets={tickets.slice(0, 3)}
        openTicketsCount={openTickets.length}
        reviewsCount={reviewsCount}
      />
    </main>
  );
}