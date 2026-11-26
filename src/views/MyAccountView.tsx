import { ComponentProps } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getAuthToken } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { DASHBOARD_SUMMARY_QUERY } from "@/lib/graphql/auth";
import UnifiedLoginFlow from "@/components/account/UnifiedLoginFlow";
import AccountDashboard from "@/components/account/AccountDashboard";
import DashboardContentSkeleton from "@/components/account/DashboardContentSkeleton";

type AccountDashboardProps = ComponentProps<typeof AccountDashboard>;
type OrderSummary = AccountDashboardProps["recentOrders"][number];
type TicketSummary = AccountDashboardProps["recentTickets"][number];

type DashboardData = Awaited<ReturnType<typeof fetchGraphQL>>;

async function AccountDashboardStream({
  user,
  dataPromise,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  dataPromise: Promise<DashboardData>;
}) {
  const data = await dataPromise;

  const recentOrders: OrderSummary[] = data?.customer?.orders?.nodes ?? [];
  const recentTickets: TicketSummary[] = data?.myTickets?.nodes ?? [];
  const stats = data?.myAccountStats;

  return (
    <AccountDashboard
      user={user}
      recentOrders={recentOrders}
      successfulOrdersCount={Number(stats?.successfulOrdersCount ?? 0)}
      recentTickets={recentTickets}
      openTicketsCount={Number(stats?.openTicketsCount ?? 0)}
      reviewsCount={Number(data?.myReviews?.totalCount ?? 0)}
    />
  );
}

export default async function MyAccountView({ resumeCart = false }: { resumeCart?: boolean }) {
  const user = await getCurrentUser();

  if (!user) {
    return <UnifiedLoginFlow />;
  }

  if (user.isStaff) {
    redirect("/admin");
  }

  if (resumeCart) {
    redirect("/cart?resumeCheckout=1");
  }

  const dataPromise = getAuthToken()
    .then((token) => fetchGraphQL(DASHBOARD_SUMMARY_QUERY, {}, [], "no-store", token || undefined))
    .catch(() => null);

  return (
    <div className="mx-auto h-full">
      <Suspense fallback={<DashboardContentSkeleton />}>
        <AccountDashboardStream user={user} dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}