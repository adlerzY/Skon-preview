import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { CUSTOMER_ORDERS_QUERY } from "@/lib/graphql/auth";
import OrdersList from "@/components/account/OrdersList";

const SUCCESSFUL_STATUSES = ["PROCESSING", "COMPLETED"];

export default async function OrdersView() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  const token = await getAuthToken();
  const data = await fetchGraphQL(CUSTOMER_ORDERS_QUERY, {}, [], "no-store", token || undefined);
  
  const allOrders = data?.customer?.orders?.nodes ?? [];
  const orders = allOrders.filter((o: any) => SUCCESSFUL_STATUSES.includes(o.status));

  const downloadableItems = data?.customer?.downloadableItems?.nodes ?? [];

  return (
    <main className="container mx-auto px-4 md:px-6 max-w-4xl py-10 md:py-16 text-brand-active" dir="rtl">
      <Link
        href="/my-account"
        className="inline-flex items-center gap-1 text-sm text-brand-m_khonsa hover:text-white transition-colors mb-6"
      >
        <ChevronRight size={16} />
        بازگشت به حساب کاربری
      </Link>
      <h1 className="text-2xl font-black mb-6">سفارش‌های من</h1>
      
      <OrdersList orders={orders} downloadableItems={downloadableItems} />
    </main>
  );
}