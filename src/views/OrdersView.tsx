import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { CUSTOMER_ORDERS_QUERY } from "@/lib/graphql/auth";
import OrdersPaginated from "@/components/account/OrdersPaginated";
import { AccountOrdersLoadingShell } from "@/components/account/AccountPageLoadingShell";

type OrdersData = Awaited<ReturnType<typeof fetchGraphQL>>;

const ALL_STATUSES = ["PENDING", "PROCESSING", "ON_HOLD", "COMPLETED", "CANCELLED", "REFUNDED", "FAILED"];

async function OrdersDataStream({ dataPromise }: { dataPromise: Promise<OrdersData> }) {
  const data = await dataPromise;
  const orders = data?.customer?.orders?.nodes ?? [];
  const pageInfo = data?.customer?.orders?.pageInfo ?? { hasNextPage: false, endCursor: null };
  const downloadableItems = data?.customer?.downloadableItems?.nodes ?? [];

  return <OrdersPaginated initialOrders={orders} initialPageInfo={pageInfo} downloadableItems={downloadableItems} />;
}

export default async function OrdersView() {
  const token = await getAuthToken();
  const dataPromise = fetchGraphQL(
    CUSTOMER_ORDERS_QUERY,
    { statuses: ALL_STATUSES },
    [],
    "no-store",
    token || undefined
  );
  const userPromise = getCurrentUser();
  const user = await userPromise;

  if (!user) redirect("/my-account");

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/my-account"
        className="inline-flex items-center gap-1 text-sm text-brand-m_khonsa hover:text-white transition-colors mb-6"
      >
        <ChevronRight size={16} />
        بازگشت به حساب کاربری
      </Link>
      <h1 className="text-2xl font-black mb-6">سفارش‌های من</h1>
      <Suspense fallback={<AccountOrdersLoadingShell />}>
        <OrdersDataStream dataPromise={dataPromise} />
      </Suspense>
    </div>
  );
}
