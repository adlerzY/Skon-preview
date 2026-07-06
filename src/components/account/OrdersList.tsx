interface OrderLineItem {
  quantity?: number;
  total?: string;
  product?: { node?: { name?: string } };
}

interface OrderNode {
  id: string;
  databaseId: number;
  orderNumber?: string;
  status?: string;
  date?: string;
  total?: string;
  lineItems?: { nodes?: OrderLineItem[] };
}

interface OrdersListProps {
  orders: OrderNode[];
  downloadableItems: any[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار پرداخت", color: "text-brand-zard bg-brand-zard/10 border-brand-zard/20" },
  PROCESSING: { label: "در حال پردازش", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" },
  ON_HOLD: { label: "در انتظار بررسی", color: "text-brand-zard bg-brand-zard/10 border-brand-zard/20" },
  COMPLETED: { label: "تکمیل‌شده", color: "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20" },
  CANCELLED: { label: "لغو‌شده", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  REFUNDED: { label: "بازگشت وجه", color: "text-brand-m_khonsa bg-brand-surface" },
  FAILED: { label: "ناموفق", color: "text-red-500 bg-red-500/10 border-red-500/20" },
};

export default function OrdersList({ orders, downloadableItems }: OrdersListProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-surface_hover p-10 text-center text-brand-m_khonsa">
        هنوز هیچ سفارشی ثبت نکرده‌اید.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => {
        const statusInfo = STATUS_LABELS[order.status ?? ""] ?? {
          label: order.status ?? "نامشخص",
          color: "text-brand-m_khonsa bg-brand-surface",
        };
        const items = order.lineItems?.nodes ?? [];

        return (
          <div key={order.id} className="bg-brand-surface border border-brand-surface_hover p-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-white">
                سفارش #{order.orderNumber || order.databaseId}
              </span>
              <span className={`text-xs font-bold px-3 py-1 border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-brand-m_khonsa">
              {order.date && <span>تاریخ: {new Date(order.date).toLocaleDateString("fa-IR")}</span>}
              {order.total && <span>مبلغ کل: {Number(order.total).toLocaleString("fa-IR")} تومان</span>}
            </div>

            {items.length > 0 && (
              <div className="border-t border-brand-surface_hover pt-3 flex flex-col gap-1.5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-brand-active">
                    <span>{item.product?.node?.name || "محصول"} × {item.quantity ?? 1}</span>
                    {item.total && (
                      <span className="text-brand-sabz font-medium">
                        {Number(item.total).toLocaleString("fa-IR")} تومان
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}