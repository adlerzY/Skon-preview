import OrdersView from "@/views/OrdersView";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string | string[]; order?: string | string[] }>;
}) {
  const { payment, order } = await searchParams;
  return (
    <OrdersView
      paymentResult={typeof payment === "string" ? payment : undefined}
      paymentOrderId={typeof order === "string" ? Number(order) || undefined : undefined}
    />
  );
}
