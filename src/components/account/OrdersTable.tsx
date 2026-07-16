"use client";

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import Badge from "@/components/ui/Badge";
import SecretReveal from "./SecretReveal";
import FulfillmentStepper from "./FulfillmentStepper";

interface MetaEntry { key: string; value: string; }
interface LineItem {
  id: string; databaseId: number; quantity?: number; total?: string;
  fulfillmentStatus?: string;
  product?: { node?: { name?: string; databaseId?: number } };
  metaData?: MetaEntry[];
}
interface OrderNode {
  id: string; databaseId: number; orderNumber?: string; status?: string; date?: string; total?: string;
  lineItems?: { nodes?: LineItem[] };
}
interface DownloadableItem { downloadId: string; url: string; product?: { databaseId?: number }; }

const STATUS_LABELS: Record<string, { label: string; tone: "blue" | "sabz" | "zard" | "red" | "neutral" }> = {
  PENDING: { label: "در انتظار پرداخت", tone: "zard" },
  PROCESSING: { label: "در حال پردازش", tone: "blue" },
  ON_HOLD: { label: "در انتظار بررسی", tone: "zard" },
  COMPLETED: { label: "تکمیل‌شده", tone: "sabz" },
  CANCELLED: { label: "لغو‌شده", tone: "red" },
  REFUNDED: { label: "بازگشت وجه", tone: "neutral" },
  FAILED: { label: "ناموفق", tone: "red" },
};

function getMeta(item: LineItem, key: string): string | undefined {
  return item.metaData?.find((m) => m.key === key)?.value;
}

export default function OrdersTable({ orders, downloadableItems = [] }: { orders: OrderNode[]; downloadableItems?: DownloadableItem[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (!orders?.length) {
    return <div className="bg-brand-surface border border-brand-surface_hover p-10 text-center text-brand-m_khonsa">هنوز هیچ سفارشی ثبت نشده است.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const isOpen = expanded.has(order.id);
        const statusInfo = STATUS_LABELS[order.status ?? ""] ?? { label: order.status ?? "نامشخص", tone: "neutral" as const };
        const items = order.lineItems?.nodes ?? [];

        return (
          <div key={order.id} className="bg-brand-surface border border-brand-surface_hover">
            <button onClick={() => toggle(order.id)} className="w-full flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 text-right">
              <div className="flex items-center gap-3">
                <ChevronDown size={16} className={`text-brand-m_khonsa transition-transform ${isOpen ? "rotate-180" : ""}`} />
                <span className="font-bold text-white text-sm">سفارش #{order.orderNumber || order.databaseId}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-m_khonsa">
                {order.date && <span>{new Date(order.date).toLocaleDateString("fa-IR")}</span>}
                <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                {order.total && <span className="text-brand-sabz font-bold">{Number(order.total).toLocaleString("fa-IR")} تومان</span>}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-brand-surface_hover overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-brand-m_khonsa text-xs border-b border-brand-surface_hover">
                      <th className="p-3 text-right font-medium">محصول</th>
                      <th className="p-3 text-right font-medium">جزئیات</th>
                      <th className="p-3 text-right font-medium">مبلغ</th>
                      <th className="p-3 text-right font-medium">تحویل / اقدام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const deliveryMethod = getMeta(item, "روش تحویل");
                      const region = getMeta(item, "ریجن");
                      const variationName = getMeta(item, "ویژگی");
                      const download = downloadableItems.find((d) => d.product?.databaseId === item.product?.node?.databaseId);

                      return (
                        <tr key={item.id} className="border-b border-brand-surface_hover/60 last:border-0">
                          <td className="p-3 align-top text-white font-medium">{item.product?.node?.name}</td>
                          <td className="p-3 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              {region && <Badge tone="blue">ریجن: {region}</Badge>}
                              {variationName && <Badge tone="neutral">{variationName}</Badge>}
                            </div>
                          </td>
                          <td className="p-3 align-top text-brand-sabz font-bold whitespace-nowrap">
                            {item.total ? Number(item.total).toLocaleString("fa-IR") : "-"} تومان
                          </td>
                          <td className="p-3 align-top">
                            {download ? (
                              <a href={download.url} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white border border-brand-blue/30 hover:bg-brand-blue px-3 py-2 transition-colors">
                                <Download size={14} /> دانلود فایل
                              </a>
                            ) : deliveryMethod === "code" ? (
                              <SecretReveal orderId={order.databaseId} itemId={item.databaseId} />
                            ) : deliveryMethod === "direct" || deliveryMethod === "gift" ? (
                              <FulfillmentStepper status={item.fulfillmentStatus || "queued"} />
                            ) : (
                              <span className="text-xs text-brand-m_khonsa">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}