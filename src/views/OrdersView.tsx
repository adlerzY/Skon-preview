import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { CUSTOMER_ORDERS_QUERY } from "@/lib/graphql/auth";
import OrdersPaginated from "@/components/account/OrdersPaginated";
import { AccountOrdersLoadingShell } from "@/components/account/AccountPageLoadingShell";
import PaymentResultBanner, { type PaymentResult } from "@/components/account/PaymentResultBanner";
import { keepVisibleOrder } from "@/lib/orderVisibility";

type OrdersData = Awaited<ReturnType<typeof fetchGraphQL>>;

const ALL_STATUSES = ["PENDING", "PROCESSING", "ON_HOLD", "COMPLETED", "CANCELLED", "REFUNDED", "FAILED"];

function resolvePaymentBanner(result: string | undefined, orderId: number | undefined, orders: any[]) {
  const knownResults: PaymentResult[] = ["success", "processing", "failed", "cancelled"];
  if (!result || !knownResults.includes(result as PaymentResult)) return null;

  const order = orderId ? orders.find((item) => Number(item.databaseId) === orderId) : undefined;
  const status = String(order?.status ?? "").toUpperCase();

  if (status === "PROCESSING" || status === "COMPLETED") {
    return { result: "success" as PaymentResult, polling: false };
  }

  if (result === "success" || result === "processing") {
    return {
      result: "processing" as PaymentResult,
      polling: Boolean(order) && (status === "PENDING" || status === "ON_HOLD"),
    };
  }

  return { result: result as PaymentResult, polling: false };
}

async function OrdersDataStream({
  dataPromise,
  paymentResult,
  paymentOrderId,
}: {
  dataPromise: Promise<OrdersData>;
  paymentResult?: string;
  paymentOrderId?: number;
}) {
  const data = await dataPromise;
  const orders = (data?.customer?.orders?.nodes ?? []).filter(keepVisibleOrder);
  const pageInfo = data?.customer?.orders?.pageInfo ?? { hasNextPage: false, endCursor: null };
  const downloadableItems = data?.customer?.downloadableItems?.nodes ?? [];
  const banner = resolvePaymentBanner(paymentResult, paymentOrderId, orders);
  const listKey = orders.map((order: any) => `${order.databaseId}:${order.status}`).join("|");

  return (
    <>
      {banner && <PaymentResultBanner result={banner.result} orderId={paymentOrderId} polling={banner.polling} />}
      <OrdersPaginated
        key={listKey}
        initialOrders={orders}
        initialPageInfo={pageInfo}
        downloadableItems={downloadableItems}
      />
    </>
  );
}

export default async function OrdersView({
  paymentResult,
  paymentOrderId,
}: {
  paymentResult?: string;
  paymentOrderId?: number;
}) {
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
        <OrdersDataStream dataPromise={dataPromise} paymentResult={paymentResult} paymentOrderId={paymentOrderId} />
      </Suspense>
    </div>
  );
}
