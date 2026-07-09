import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAuthToken, getCurrentUser } from "@/lib/auth/session";
import { fetchGraphQL } from "@/lib/graphql";
import { CUSTOMER_ORDERS_LIGHT_QUERY } from "@/lib/graphql/auth";
import NewTicketForm from "@/components/account/NewTicketForm";

export const dynamic = "force-dynamic";

export default async function NewTicketPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/my-account");

  const token = await getAuthToken();
  const data = await fetchGraphQL(CUSTOMER_ORDERS_LIGHT_QUERY, {}, [], "no-store", token || undefined);
  const orders = data?.customer?.orders?.nodes ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <Link
        href="/my-account/tickets"
        className="inline-flex items-center gap-1 text-sm text-brand-m_khonsa hover:text-white transition-colors"
      >
        <ChevronRight size={16} />
        بازگشت به تیکت‌ها
      </Link>
      <h1 className="text-xl font-black text-white">ارسال تیکت جدید</h1>
      <NewTicketForm orders={orders} />
    </div>
  );
}