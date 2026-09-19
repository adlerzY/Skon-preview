"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, KeyRound, Plus, Save } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminField, AdminFieldRow, AdminPage, AdminPageIntro, AdminSectionHeader, AdminSelect, AdminTextarea } from "./AdminUi";

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
  databaseId:number; orderNumber:string; status:string; paymentStatus:string; fulfillmentStatus:string; total:string; currency:string; date:string;
  customerId:number|null; customerName:string; customerEmail:string; linkedTicketIds:number[];
  items:OrderItem[]; notes:Array<{id:number;content:string;date:string;author:string}>;
}

const ORDER_STATUS_LABELS: Record<string,string> = { pending:"در انتظار", processing:"در حال پردازش", "on-hold":"در انتظار اقدام", completed:"تکمیل‌شده", cancelled:"لغوشده", refunded:"مستردشده", failed:"ناموفق" };
const PAYMENT_STATUS_LABELS: Record<string,string> = { paid:"پرداخت‌شده", unpaid:"پرداخت‌نشده" };
const FULFILLMENT_STATUS_LABELS: Record<string,string> = { queued:"در صف", processing:"در حال تکمیل", completed:"تکمیل کامل" };

export default function AdminOrderDetail({ order: initialOrder, id }: { order?: Order; id: number }) {
  const { permissions } = useAdminContext();
  const [order, setOrder] = useState<Order | null>(initialOrder ?? null);
  const [status, setStatus] = useState(initialOrder?.status ?? "processing");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(!initialOrder);
  const [saving, setSaving] = useState(false);
  const [fulfillLoading, setFulfillLoading] = useState<number | null>(null);
  const [cdkeyBusy, setCdkeyBusy] = useState<number | null>(null);
  const [manualKeys, setManualKeys] = useState<Record<number,string>>({});
  const [assignQty, setAssignQty] = useState<Record<number,number>>({});
  const [revealed, setRevealed] = useState<Record<number,string[]>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialOrder) return;
    fetch(`/api/admin/orders/${id}`, { cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data?.error || "سفارش یافت نشد"); setOrder(data); setStatus(data.status); })
      .catch(reason => setError(reason instanceof Error ? reason.message : "خطا در دریافت سفارش"))
      .finally(() => setLoading(false));
  }, [id, initialOrder]);

  const reload = async () => {
    if (!order) return;
    const response = await fetch(`/api/admin/orders/${order.databaseId}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setOrder(data); setStatus(data.status);
  };
  const postOrder = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/admin/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "عملیات سفارش انجام نشد");
    return data;
  };
  const postCdKey = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/admin/cdkeys", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "عملیات CD Key انجام نشد");
    return data;
  };
  const addNote = async () => {
    if (!order || !note.trim()) return;
    setSaving(true); setError("");
    try { await postOrder({action:"addNote",orderId:order.databaseId,content:note}); setNote(""); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "ذخیره یادداشت انجام نشد"); }
    finally { setSaving(false); }
  };
  const updateStatus = async () => {
    if (!order) return;
    setSaving(true); setError("");
    try { await postOrder({action:"updateStatus",orderId:order.databaseId,status}); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "تغییر وضعیت انجام نشد"); }
    finally { setSaving(false); }
  };
  const updateFulfillment = async (itemId:number, next:string) => {
    if (!order) return;
    setFulfillLoading(itemId); setError("");
    try { await postOrder({action:"updateFulfillment",orderId:order.databaseId,itemId,status:next}); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "تکمیل آیتم انجام نشد"); }
    finally { setFulfillLoading(null); }
  };
  const assignFromStock = async (item:OrderItem) => {
    if (!order) return;
    const quantity = Math.max(1, Math.min(item.quantity - item.deliveredQuantity, Number(assignQty[item.databaseId] || 1)));
    setCdkeyBusy(item.databaseId); setError("");
    try { await postCdKey({action:"assign",orderId:order.databaseId,itemId:item.databaseId,quantity}); await reload(); setAssignQty(prev=>({...prev,[item.databaseId]:1})); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "تخصیص CD Key انجام نشد"); }
    finally { setCdkeyBusy(null); }
  };
  const assignManual = async (item:OrderItem) => {
    if (!order) return;
    const value = String(manualKeys[item.databaseId] || "").trim(); if (!value) return;
    setCdkeyBusy(item.databaseId); setError("");
    try { await postCdKey({action:"manualAssign",orderId:order.databaseId,itemId:item.databaseId,key:value}); setManualKeys(prev=>({...prev,[item.databaseId]:""})); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "تخصیص دستی CD Key انجام نشد"); }
    finally { setCdkeyBusy(null); }
  };
  const revealKeys = async (item:OrderItem) => {
    if (!order) return;
    setCdkeyBusy(item.databaseId); setError("");
    try { const data = await postCdKey({action:"reveal",orderId:order.databaseId,itemId:item.databaseId}); setRevealed(prev=>({...prev,[item.databaseId]:Array.isArray(data?.adminRevealCdKeys?.values) ? data.adminRevealCdKeys.values : []})); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "نمایش CD Key انجام نشد"); }
    finally { setCdkeyBusy(null); }
  };

  if (!order) return <AdminPage><Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs font-bold text-brand-m_khonsa hover:text-white"><ArrowRight size={15}/> بازگشت به سفارش‌ها</Link><div className="mt-4"><AdminEmpty title={loading?"اطلاعات سفارش در حال دریافت است...":"سفارش پیدا نشد."}/></div></AdminPage>;

  return <AdminPage>
    <div className="mb-4 flex items-center justify-between gap-3"><Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs font-bold text-brand-m_khonsa hover:text-white"><ArrowRight size={15}/> بازگشت به سفارش‌ها</Link><AdminBadge tone={order.paymentStatus === "paid" ? "success" : "warning"}>{PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}</AdminBadge></div>
    <AdminPageIntro eyebrow="جزئیات سفارش" title={`سفارش #${order.orderNumber}`} description={order.date ? new Date(order.date).toLocaleString("fa-IR") : ""} />
    {error && <div className="mb-4 rounded-[4px] border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-200">{error}</div>}
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.75fr]">
      <div className="space-y-4">
        <AdminCard className="overflow-hidden"><AdminSectionHeader title="خلاصه سفارش" action={<div className="text-left"><div className="text-[9px] text-brand-m_khonsa">مبلغ</div><div className="text-lg font-black text-white" dir="ltr">{order.total} {order.currency}</div></div>} /><div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4"><Stat label="وضعیت" value={ORDER_STATUS_LABELS[order.status] ?? order.status}/><Stat label="پرداخت" value={PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}/><Stat label="تکمیل سفارش" value={FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}/><Stat label="مشتری" value={order.customerName || "—"}/></div></AdminCard>
        <AdminCard className="overflow-hidden"><AdminSectionHeader title="اقلام سفارش" description={`${order.items.length.toLocaleString("fa-IR")} آیتم`}/><div className="divide-y divide-brand-surface_hover px-4">{order.items.map(item=><div key={item.databaseId} className="py-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="text-xs font-black text-white">{item.productName}</div><div className="mt-1 text-[10px] text-brand-m_khonsa">شناسه {item.databaseId} · {item.deliveryMethod === "code" ? "CD Key" : item.deliveryMethod} · {item.quantity} عدد</div></div><div className="flex flex-wrap items-center gap-2"><AdminBadge tone={item.fulfillmentStatus === "completed" ? "success" : "info"}>{FULFILLMENT_STATUS_LABELS[item.fulfillmentStatus] ?? item.fulfillmentStatus}</AdminBadge><span className="text-[10px] font-bold text-brand-m_khonsa">{item.deliveredQuantity}/{item.quantity}</span>{permissions.includes("orders.fulfill") && item.deliveryMethod !== "code" && item.fulfillmentStatus !== "completed" && <AdminButton variant="primary" onClick={()=>updateFulfillment(item.databaseId,"completed")} disabled={fulfillLoading===item.databaseId} className="min-h-9 px-3"><Save size={12}/>{fulfillLoading===item.databaseId?"...":"تکمیل"}</AdminButton>}</div></div>
          {item.deliveryMethod === "code" && permissions.includes("cdkeys.read") && <div className="mt-3 rounded-[4px] border border-brand-surface_hover bg-brand-bg/50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-brand-blue/10 text-brand-blue"><KeyRound size={15}/></span><div><div className="text-xs font-black text-white">تحویل CD Key</div><div className="mt-1 text-[10px] text-brand-m_khonsa">تخصیص‌شده: {item.deliveredQuantity} از {item.quantity}</div></div></div>{item.deliveredQuantity >= item.quantity && permissions.includes("cdkeys.reveal") && <AdminButton onClick={()=>revealKeys(item)} disabled={cdkeyBusy===item.databaseId}><Eye size={13}/> نمایش کدها</AdminButton>}</div>
            {permissions.includes("cdkeys.write") && item.deliveredQuantity < item.quantity && order.paymentStatus === "paid" && <div className="mt-3 grid gap-2 lg:grid-cols-[110px_1fr_auto]"><AdminField type="number" min={1} max={item.quantity-item.deliveredQuantity} value={assignQty[item.databaseId] ?? 1} onChange={e=>setAssignQty(prev=>({...prev,[item.databaseId]:Number(e.target.value)}))}/><div className="flex min-h-10 items-center rounded-[4px] border border-brand-surface_hover px-3 text-[10px] text-brand-m_khonsa">رزرو و تخصیص از موجودی داخلی</div><AdminButton variant="primary" onClick={()=>assignFromStock(item)} disabled={cdkeyBusy===item.databaseId}>تخصیص</AdminButton></div>}
            {permissions.includes("cdkeys.write") && item.deliveredQuantity < item.quantity && order.paymentStatus === "paid" && <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_auto]"><AdminField value={manualKeys[item.databaseId] ?? ""} onChange={e=>setManualKeys(prev=>({...prev,[item.databaseId]:e.target.value}))} placeholder="ثبت دستی یک CD Key" dir="ltr"/><AdminButton onClick={()=>assignManual(item)} disabled={cdkeyBusy===item.databaseId || !String(manualKeys[item.databaseId]||"").trim()}>ثبت دستی</AdminButton></div>}
            {revealed[item.databaseId]?.length ? <div className="mt-3 space-y-2">{revealed[item.databaseId].map((value,index)=><div key={`${item.databaseId}-${index}`} className="rounded-[4px] border border-red-500/20 bg-red-500/5 p-3 text-xs text-white" dir="ltr">{value}</div>)}</div> : null}
            {item.deliveredQuantity < item.quantity && order.paymentStatus !== "paid" && <div className="mt-3 text-[11px] text-brand-zard">برای تخصیص CD Key، سفارش باید پرداخت‌شده باشد.</div>}
          </div>}
        </div>)}</div></AdminCard>
        <AdminCard className="overflow-hidden"><AdminSectionHeader title="یادداشت‌های داخلی"/><div className="space-y-2 p-4">{order.notes.map(n=><div key={n.id} className="rounded-[4px] border border-brand-surface_hover bg-brand-bg/30 p-3"><div className="whitespace-pre-wrap text-xs leading-6 text-white">{n.content}</div><div className="mt-2 text-[10px] text-brand-m_khonsa">{n.author} · {n.date ? new Date(n.date).toLocaleString("fa-IR") : "—"}</div></div>)}{order.notes.length===0&&<AdminEmpty title="یادداشت داخلی وجود ندارد."/>}</div>{permissions.includes("orders.write")&&<div className="border-t border-white/[.06] p-4"><AdminTextarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="یادداشت داخلی..."/><div className="mt-2 flex justify-end"><AdminButton variant="primary" onClick={addNote} disabled={saving||!note.trim()}><Plus size={14}/> ذخیره یادداشت</AdminButton></div></div>}</AdminCard>
      </div>
      <div className="space-y-4"><AdminCard className="overflow-hidden"><AdminSectionHeader title="مشتری"/><div className="p-4"><AdminFieldRow label="نام" value={order.customerName || "—"} ltr={false}/><AdminFieldRow label="ایمیل" value={order.customerEmail || "—"}/>{order.customerId&&<Link href={`/admin/customers/${order.customerId}`} className="mt-3 inline-block text-xs font-bold text-brand-blue hover:text-white">پروفایل مشتری</Link>}</div></AdminCard>
        {permissions.includes("orders.write")&&<AdminCard className="overflow-hidden"><AdminSectionHeader title="وضعیت سفارش"/><div className="p-4"><AdminSelect value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">در انتظار</option><option value="processing">در حال پردازش</option><option value="on-hold">در انتظار اقدام</option><option value="completed" disabled={order.fulfillmentStatus!=="completed"}>تکمیل‌شده</option><option value="cancelled">لغوشده</option><option value="refunded">مستردشده</option><option value="failed">ناموفق</option></AdminSelect><AdminButton variant="primary" onClick={updateStatus} disabled={saving||status===order.status} className="mt-2 w-full">ذخیره وضعیت</AdminButton></div></AdminCard>}
        <AdminCard className="overflow-hidden"><AdminSectionHeader title="تیکت‌های مرتبط"/><div className="p-4">{order.linkedTicketIds.length?order.linkedTicketIds.map(ticketId=><Link key={ticketId} href={`/admin/tickets/${ticketId}`} className="flex items-center justify-between border-b border-brand-surface_hover py-2.5 last:border-0 text-xs font-bold text-brand-blue hover:text-white"><span>تیکت #{ticketId}</span><ArrowRight size={13}/></Link>):<AdminEmpty title="تیکت مرتبطی ثبت نشده است."/>}</div></AdminCard></div>
    </div>
  </AdminPage>;
}

function Stat({label,value}:{label:string;value:string}){return <div className="rounded-[4px] border border-brand-surface_hover bg-brand-bg/30 p-3"><div className="text-[10px] text-brand-m_khonsa">{label}</div><div className="mt-1 break-words text-xs font-black text-white">{value}</div></div>}
