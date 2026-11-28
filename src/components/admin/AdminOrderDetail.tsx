"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminFieldRow,
  AdminPage,
  AdminPageIntro,
  AdminSectionHeader,
  AdminSelect,
  AdminTextarea,
} from "./AdminUi";
import { AdminErrorBanner } from "./AdminListParts";
import { faDateTime, faNumber } from "./format";
import {
  DELIVERY_LABELS,
  FULFILLMENT_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  fulfillmentTone,
  orderStatusTone,
} from "./labels";

interface OrderItem {
  databaseId: number;
  productId: number;
  variationId: number;
  productName: string;
  quantity: number;
  deliveryMethod: string;
  deliveredQuantity: number;
  fulfillmentStatus: string;
}

interface Order {
  databaseId: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: string;
  currency: string;
  date: string;
  customerId: number | null;
  customerName: string;
  customerEmail: string;
  linkedTicketIds: number[];
  items: OrderItem[];
  notes: Array<{ id: number; content: string; date: string; author: string }>;
}

export default function AdminOrderDetail({ order: initialOrder, id }: { order?: Order; id: number }) {
  const { permissions } = useAdminContext();
  const [order, setOrder] = useState<Order | null>(initialOrder ?? null);
  const [status, setStatus] = useState(initialOrder?.status ?? "processing");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(!initialOrder);
  const [saving, setSaving] = useState(false);
  const [fulfillLoading, setFulfillLoading] = useState<number | null>(null);
  const [cdkeyBusy, setCdkeyBusy] = useState<number | null>(null);
  const [manualKeys, setManualKeys] = useState<Record<number, string>>({});
  const [assignQty, setAssignQty] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, string[]>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialOrder) return;
    fetch(`/api/admin/orders/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "سفارش یافت نشد");
        setOrder(data);
        setStatus(data.status);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "خطا در دریافت سفارش"))
      .finally(() => setLoading(false));
  }, [id, initialOrder]);

  const reload = async () => {
    if (!order) return;
    const response = await fetch(`/api/admin/orders/${order.databaseId}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setOrder(data);
    setStatus(data.status);
  };

  const postOrder = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "عملیات سفارش انجام نشد");
    return data;
  };

  const postCdKey = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/admin/cdkeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "عملیات CD Key انجام نشد");
    return data;
  };

  const addNote = async () => {
    if (!order || !note.trim()) return;
    setSaving(true);
    setError("");
    try {
      await postOrder({ action: "addNote", orderId: order.databaseId, content: note });
      setNote("");
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره یادداشت انجام نشد");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!order) return;
    setSaving(true);
    setError("");
    try {
      await postOrder({ action: "updateStatus", orderId: order.databaseId, status });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تغییر وضعیت انجام نشد");
    } finally {
      setSaving(false);
    }
  };

  const updateFulfillment = async (itemId: number, next: string) => {
    if (!order) return;
    setFulfillLoading(itemId);
    setError("");
    try {
      await postOrder({ action: "updateFulfillment", orderId: order.databaseId, itemId, status: next });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تکمیل آیتم انجام نشد");
    } finally {
      setFulfillLoading(null);
    }
  };

  const assignFromStock = async (item: OrderItem) => {
    if (!order) return;
    const quantity = Math.max(1, Math.min(item.quantity - item.deliveredQuantity, Number(assignQty[item.databaseId] || 1)));
    setCdkeyBusy(item.databaseId);
    setError("");
    try {
      await postCdKey({ action: "assign", orderId: order.databaseId, itemId: item.databaseId, quantity });
      await reload();
      setAssignQty((previous) => ({ ...previous, [item.databaseId]: 1 }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تخصیص CD Key انجام نشد");
    } finally {
      setCdkeyBusy(null);
    }
  };

  const assignManual = async (item: OrderItem) => {
    if (!order) return;
    const value = String(manualKeys[item.databaseId] || "").trim();
    if (!value) return;
    setCdkeyBusy(item.databaseId);
    setError("");
    try {
      await postCdKey({ action: "manualAssign", orderId: order.databaseId, itemId: item.databaseId, key: value });
      setManualKeys((previous) => ({ ...previous, [item.databaseId]: "" }));
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تخصیص دستی CD Key انجام نشد");
    } finally {
      setCdkeyBusy(null);
    }
  };

  const revealKeys = async (item: OrderItem) => {
    if (!order) return;
    setCdkeyBusy(item.databaseId);
    setError("");
    try {
      const data = await postCdKey({ action: "reveal", orderId: order.databaseId, itemId: item.databaseId });
      setRevealed((previous) => ({
        ...previous,
        [item.databaseId]: Array.isArray(data?.adminRevealCdKeys?.values) ? data.adminRevealCdKeys.values : [],
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "نمایش CD Key انجام نشد");
    } finally {
      setCdkeyBusy(null);
    }
  };

  if (!order) {
    return (
      <AdminPage>
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-[13px] text-brand-m_khonsa hover:text-brand-white">
          <ArrowRight size={15} /> بازگشت به سفارش‌ها
        </Link>
        <div className="mt-4">
          <AdminErrorBanner message={error} />
          <AdminEmpty title={loading ? "اطلاعات سفارش در حال دریافت است..." : "سفارش پیدا نشد."} />
        </div>
      </AdminPage>
    );
  }

  const canWrite = permissions.includes("orders.write");
  const canFulfill = permissions.includes("orders.fulfill");
  const canReadKeys = permissions.includes("cdkeys.read");
  const canWriteKeys = permissions.includes("cdkeys.write");
  const canRevealKeys = permissions.includes("cdkeys.reveal");
  const isPaid = order.paymentStatus === "paid";

  return (
    <AdminPage>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-[13px] text-brand-m_khonsa hover:text-brand-white">
          <ArrowRight size={15} /> بازگشت به سفارش‌ها
        </Link>
        <AdminBadge tone={orderStatusTone(order.status)}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</AdminBadge>
      </div>

      <AdminPageIntro title={`سفارش #${order.orderNumber}`} description={faDateTime(order.date)} />

      <AdminErrorBanner message={error} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="اقلام سفارش" description={`${faNumber(order.items.length)} آیتم`} />
            {order.items.map((item) => {
              const isCode = item.deliveryMethod === "code";
              const remaining = item.quantity - item.deliveredQuantity;
              const showKeys = isCode && canReadKeys;
              const canAssign = canWriteKeys && remaining > 0 && isPaid;
              const canReveal = canRevealKeys && remaining <= 0;
              const busy = cdkeyBusy === item.databaseId;

              return (
                <div key={item.databaseId} className="border-b border-brand-surface_hover last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-brand-active">{item.productName}</div>
                      <div className="mt-0.5 text-[12px] text-brand-m_khonsa">
                        {DELIVERY_LABELS[item.deliveryMethod] ?? item.deliveryMethod} · {faNumber(item.quantity)} عدد · شناسه {faNumber(item.databaseId)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-brand-m_khonsa">
                        {faNumber(item.deliveredQuantity)}/{faNumber(item.quantity)}
                      </span>
                      <AdminBadge tone={fulfillmentTone(item.fulfillmentStatus)}>
                        {FULFILLMENT_LABELS[item.fulfillmentStatus] ?? item.fulfillmentStatus}
                      </AdminBadge>
                      {canFulfill && !isCode && item.fulfillmentStatus !== "completed" ? (
                        <AdminButton
                          variant="primary"
                          onClick={() => void updateFulfillment(item.databaseId, "completed")}
                          disabled={fulfillLoading === item.databaseId}
                        >
                          {fulfillLoading === item.databaseId ? "..." : "تکمیل تحویل"}
                        </AdminButton>
                      ) : null}
                    </div>
                  </div>

                  {showKeys ? (
                    <details className="border-t border-brand-surface_hover">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-[13px] text-brand-m_khonsa transition-colors hover:text-brand-active marker:content-none [&::-webkit-details-marker]:hidden">
                        <span>مدیریت CD Key</span>
                        <span className="text-brand-surface_m">
                          {faNumber(item.deliveredQuantity)} از {faNumber(item.quantity)} تخصیص‌یافته
                        </span>
                      </summary>
                      <div className="space-y-3 border-t border-brand-surface_hover px-4 py-3">
                        {remaining > 0 && !isPaid ? (
                          <p className="text-[13px] text-brand-zard">برای تخصیص CD Key، سفارش باید پرداخت‌شده باشد.</p>
                        ) : null}

                        {canAssign ? (
                          <>
                            <div className="grid gap-2 sm:grid-cols-[110px_auto] sm:justify-start">
                              <AdminField
                                type="number"
                                min={1}
                                max={remaining}
                                value={assignQty[item.databaseId] ?? 1}
                                onChange={(event) =>
                                  setAssignQty((previous) => ({ ...previous, [item.databaseId]: Number(event.target.value) }))
                                }
                              />
                              <AdminButton variant="primary" onClick={() => void assignFromStock(item)} disabled={busy}>
                                تخصیص از موجودی
                              </AdminButton>
                            </div>
                            <details>
                              <summary className="cursor-pointer text-[13px] text-brand-blue hover:text-brand-active">ثبت دستی یک کلید</summary>
                              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                                <AdminField
                                  value={manualKeys[item.databaseId] ?? ""}
                                  onChange={(event) =>
                                    setManualKeys((previous) => ({ ...previous, [item.databaseId]: event.target.value }))
                                  }
                                  placeholder="CD Key"
                                  dir="ltr"
                                />
                                <AdminButton
                                  onClick={() => void assignManual(item)}
                                  disabled={busy || !String(manualKeys[item.databaseId] || "").trim()}
                                >
                                  ثبت دستی
                                </AdminButton>
                              </div>
                            </details>
                          </>
                        ) : null}

                        {canReveal ? (
                          <AdminButton onClick={() => void revealKeys(item)} disabled={busy}>
                            نمایش کدها
                          </AdminButton>
                        ) : null}

                        {revealed[item.databaseId]?.length ? (
                          <div className="space-y-2">
                            {revealed[item.databaseId].map((value, index) => (
                              <div
                                key={`${item.databaseId}-${index}`}
                                className="rounded-[5px] border border-brand-zard/40 bg-brand-zard/10 px-3 py-2 text-[13px] text-brand-active"
                                dir="ltr"
                              >
                                {value}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            })}
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <details>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold text-brand-active marker:content-none [&::-webkit-details-marker]:hidden">
                <span>یادداشت‌های داخلی</span>
                <span className="text-[13px] font-normal text-brand-surface_m">{faNumber(order.notes.length)}</span>
              </summary>
              <div className="space-y-2 border-t border-brand-surface_hover p-4">
                {order.notes.map((entry) => (
                  <div key={entry.id} className="rounded-[5px] border border-brand-surface_hover bg-brand-bg p-3">
                    <div className="whitespace-pre-wrap text-[14px] leading-7 text-brand-active">{entry.content}</div>
                    <div className="mt-1.5 text-[12px] text-brand-m_khonsa">
                      {entry.author} · {faDateTime(entry.date)}
                    </div>
                  </div>
                ))}
                {order.notes.length === 0 ? <AdminEmpty title="یادداشت داخلی وجود ندارد." /> : null}
                {canWrite ? (
                  <div className="pt-2">
                    <AdminTextarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="یادداشت داخلی..." />
                    <div className="mt-2 flex justify-end">
                      <AdminButton variant="primary" onClick={addNote} disabled={saving || !note.trim()}>
                        ذخیره یادداشت
                      </AdminButton>
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="اطلاعات سفارش" />
            <div className="px-4 py-1">
              <AdminFieldRow
                label="پرداخت"
                value={<AdminBadge tone={isPaid ? "success" : "warning"}>{PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}</AdminBadge>}
                ltr={false}
              />
              <AdminFieldRow
                label="تحویل"
                value={
                  <AdminBadge tone={fulfillmentTone(order.fulfillmentStatus)}>
                    {FULFILLMENT_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                  </AdminBadge>
                }
                ltr={false}
              />
              <AdminFieldRow label="مبلغ" value={`${order.total} ${order.currency}`} />
              <AdminFieldRow label="مشتری" value={order.customerName || "—"} ltr={false} />
              <AdminFieldRow label="ایمیل" value={order.customerEmail || "—"} />
              {order.customerId ? (
                <div className="py-2.5">
                  <Link href={`/admin/users/${order.customerId}`} className="text-[13px] text-brand-blue hover:text-brand-active">
                    مشاهدهٔ پروندهٔ مشتری
                  </Link>
                </div>
              ) : null}
            </div>
          </AdminCard>

          {canWrite ? (
            <AdminCard className="overflow-hidden">
              <AdminSectionHeader title="تغییر وضعیت" />
              <div className="space-y-2 p-4">
                <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)}>
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value} disabled={value === "completed" && order.fulfillmentStatus !== "completed"}>
                      {label}
                    </option>
                  ))}
                </AdminSelect>
                <AdminButton variant="primary" onClick={updateStatus} disabled={saving || status === order.status} className="w-full">
                  ذخیره وضعیت
                </AdminButton>
              </div>
            </AdminCard>
          ) : null}

          {order.linkedTicketIds.length > 0 ? (
            <AdminCard className="overflow-hidden">
              <AdminSectionHeader title="تیکت‌های مرتبط" />
              <div>
                {order.linkedTicketIds.map((ticketId) => (
                  <Link
                    key={ticketId}
                    href={`/admin/tickets/${ticketId}`}
                    className="flex items-center justify-between border-b border-brand-surface_hover px-4 py-3 text-[14px] text-brand-blue transition-colors last:border-b-0 hover:bg-brand-surface_hover/40"
                  >
                    <span>تیکت #{faNumber(ticketId)}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </AdminCard>
          ) : null}
        </div>
      </div>
    </AdminPage>
  );
}