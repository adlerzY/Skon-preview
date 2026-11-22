import { ChevronDown, Download } from "lucide-react";
import Badge from "@/components/ui/Badge";
import SecretReveal from "./SecretReveal";
import FulfillmentStepper from "./FulfillmentStepper";
import OrderPayActions, { type ReorderLine } from "./OrderPayActions";
import { resolveOrderDisplay, type StatusTone } from "@/lib/orderStatus";

interface MetaEntry { key: string; value: string; }
interface LineItem {
  id: string; databaseId: number; quantity?: number; total?: string;
  fulfillmentStatus?: string;
  cdkeyReady?: boolean;
  btlProductId?: number;
  btlVariationId?: number;
  btlUnitPrice?: number;
  product?: { node?: { name?: string; databaseId?: number } };
  metaData?: MetaEntry[];
}
interface OrderNode {
  id: string; databaseId: number; orderNumber?: string; status?: string; date?: string; cancelledAt?: string; total?: string;
  paymentState?: string | null;
  fulfillmentSummary?: string | null;
  retryMode?: string | null;
  payDeadline?: string | null;
  lineItems?: { nodes?: LineItem[] };
}
interface DownloadableItem { downloadId: string; url: string; product?: { databaseId?: number }; }

const TEXT_TONE: Record<StatusTone, string> = {
  blue: "text-brand-blue",
  sabz: "text-brand-sabz",
  zard: "text-brand-zard",
  red: "text-red-500",
  neutral: "text-brand-m_khonsa",
};

function getMeta(item: LineItem, key: string): string | undefined {
  return item.metaData?.find((m) => m.key === key)?.value;
}

function buildReorderLines(items: LineItem[]): ReorderLine[] {
  const lines: ReorderLine[] = [];
  for (const item of items) {
    const productId = item.btlProductId || item.product?.node?.databaseId || 0;
    const deliveryMethod = getMeta(item, "روش تحویل") ?? "";
    const unitPrice = Number(item.btlUnitPrice) || 0;
    if (!productId || !deliveryMethod || unitPrice <= 0) continue;
    lines.push({
      productId,
      variationId: item.btlVariationId || undefined,
      name: item.product?.node?.name ?? "",
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice,
      deliveryMethod,
      region: getMeta(item, "ریجن"),
      variationName: getMeta(item, "ویژگی"),
    });
  }
  return lines;
}

export default function OrdersTable({ orders, downloadableItems = [] }: { orders: OrderNode[]; downloadableItems?: DownloadableItem[] }) {
  const downloadsByProduct = new Map<number, DownloadableItem>();
  for (const download of downloadableItems) {
    const productId = download.product?.databaseId;
    if (productId != null && !downloadsByProduct.has(productId)) {
      downloadsByProduct.set(productId, download);
    }
  }
  if (!orders?.length) {
    return <div className="bg-brand-surface border border-brand-surface_hover p-10 text-center text-brand-m_khonsa">هنوز هیچ سفارشی ثبت نشده است.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const display = resolveOrderDisplay(order);
        const items = order.lineItems?.nodes ?? [];
        const mode = order.retryMode ?? "none";
        const actionable = mode === "pay" || mode === "reopen";

        return (
          <details key={order.id} open={actionable} className="bg-brand-surface border border-brand-surface_hover group">
            <summary className="list-none cursor-pointer w-full flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
              <div className="flex items-center gap-3">
                <ChevronDown size={16} className="text-brand-m_khonsa transition-transform group-open:rotate-180" />
                <span className="font-bold text-white text-sm">سفارش #{order.orderNumber || order.databaseId}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-brand-m_khonsa">
                {order.date && <span>{new Date(order.date).toLocaleDateString("fa-IR")}</span>}
                <Badge tone={display.tone}>{display.label}</Badge>
                {order.total && <span className="text-brand-sabz font-bold">{Number(order.total).toLocaleString("fa-IR")} تومان</span>}
              </div>
            </summary>

            {mode !== "none" && (
              <OrderPayActions
                orderId={order.databaseId}
                orderNumber={String(order.orderNumber || order.databaseId)}
                mode={mode}
                deadline={order.payDeadline}
                lines={buildReorderLines(items)}
              />
            )}

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
                    const download = display.isPaid && item.product?.node?.databaseId != null
                      ? downloadsByProduct.get(item.product.node.databaseId)
                      : undefined;

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
                          {!display.isPaid ? (
                            <span className={`text-xs font-bold ${TEXT_TONE[display.itemTone]}`}>{display.itemText}</span>
                          ) : download ? (
                            <a href={download.url} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white border border-brand-blue/30 hover:bg-brand-blue px-3 py-2 transition-colors">
                              <Download size={14} /> دانلود فایل
                            </a>
                          ) : deliveryMethod === "code" ? (
                            item.cdkeyReady ? (
                              <SecretReveal orderId={order.databaseId} itemId={item.databaseId} />
                            ) : (
                              <span className="text-xs text-brand-zard font-bold">در حال آماده‌سازی کد...</span>
                            )
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
          </details>
        );
      })}
    </div>
  );
}