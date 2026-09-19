"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, ClipboardList, LifeBuoy, MessageSquare, UserRound } from "lucide-react";
import { AdminBadge, AdminCard, AdminEmpty, AdminFieldRow, AdminPage, AdminPageIntro, AdminSectionHeader } from "./AdminUi";

const ORDER_STATUS_LABELS: Record<string,string> = { pending:"در انتظار", processing:"در حال پردازش", "on-hold":"در انتظار اقدام", completed:"تکمیل‌شده", cancelled:"لغوشده", refunded:"مستردشده", failed:"ناموفق" };
const FULFILLMENT_STATUS_LABELS: Record<string,string> = { pending:"در انتظار تکمیل", processing:"در حال تکمیل", partially_fulfilled:"تکمیل ناقص", fulfilled:"تکمیل‌شده", completed:"تکمیل کامل", cancelled:"لغوشده" };
const TICKET_STATUS_LABELS: Record<string,string> = { open:"باز", claimed:"در اختیار ادمین", waiting_user:"در انتظار کاربر", waiting_staff:"در انتظار پشتیبانی", resolved:"حل‌شده", closed:"بسته‌شده" };

export default function AdminCustomerDetail({data:initialData,id}:{data?:any;id:number}){
  const [data,setData]=useState(initialData??null),[loading,setLoading]=useState(!initialData),[error,setError]=useState("");
  useEffect(()=>{if(initialData)return;fetch(`/api/admin/customers/${id}`,{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d?.error||"کاربر یافت نشد");setData(d)}).catch(e=>setError(e instanceof Error?e.message:"خطا در دریافت کاربر")).finally(()=>setLoading(false));},[id,initialData]);

  if(!data) return <AdminPage><AdminBackLink href="/admin/customers"><ArrowRight size={15}/> بازگشت به مشتریان</AdminBackLink>{error&&<div className="mt-4 rounded-[4px] border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-200">{error}</div>}<div className="mt-4"><AdminEmpty title={loading?"پروفایل در حال دریافت اطلاعات...":"کاربر پیدا نشد."}/></div></AdminPage>;

  const c=data.customer;
  return <AdminPage>
    <div className="mb-4 flex items-center justify-between gap-3"><AdminBackLink href="/admin/customers"><ArrowRight size={15}/> بازگشت به مشتریان</AdminBackLink><AdminBadge tone={c.isStaff?"info":"neutral"}>{c.isStaff?"مدیر":"مشتری"}</AdminBadge></div>
    <AdminPageIntro eyebrow="پرونده مشتری" title={c.name||"بدون نام"} description={`شناسه مشتری #${c.databaseId}`} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      <AdminCard className="overflow-hidden"><AdminSectionHeader icon={<UserRound size={17}/>} title="اطلاعات حساب" description="مشخصات پایه و آمار فعالیت مشتری"/><div className="p-4"><AdminFieldRow label="ایمیل" value={c.email||"—"}/><AdminFieldRow label="ثبت‌نام" value={c.registeredAt?new Date(c.registeredAt).toLocaleString("fa-IR"):"—"}/><AdminFieldRow label="سفارش‌ها" value={c.ordersCount.toLocaleString("fa-IR")} ltr={false}/><AdminFieldRow label="تیکت‌ها" value={c.ticketsCount.toLocaleString("fa-IR")} ltr={false}/><AdminFieldRow label="دیدگاه‌ها" value={c.reviewsCount.toLocaleString("fa-IR")} ltr={false}/><div className="mt-4 rounded-[4px] bg-white/[.025] p-3 text-[10px] leading-5 text-brand-m_khonsa">اطلاعات احراز هویت و فیلدهای امنیتی در این صفحه نمایش داده نمی‌شوند.</div></div></AdminCard>
      <div className="space-y-4">
        <Collection icon={<ClipboardList size={17}/>} title="سفارش‌های اخیر">{data.orders?.map((o:any)=><Link key={o.databaseId} href={`/admin/orders/${o.databaseId}`} className="flex items-center justify-between gap-3 border-b border-brand-surface_hover py-3 last:border-0 hover:bg-white/[.015]"><div className="min-w-0"><div className="text-xs font-black text-white">#{o.orderNumber}</div><div className="mt-1 text-[10px] text-brand-m_khonsa">{ORDER_STATUS_LABELS[o.status] ?? o.status} · {FULFILLMENT_STATUS_LABELS[o.fulfillmentStatus] ?? o.fulfillmentStatus}</div></div><span className="shrink-0 text-xs font-bold text-brand-blue" dir="ltr">{o.total} {o.currency}</span></Link>)}{!data.orders?.length&&<AdminEmpty title="سفارشی ثبت نشده است."/>}</Collection>
        <Collection icon={<LifeBuoy size={17}/>} title="تیکت‌های اخیر">{data.tickets?.map((t:any)=><Link key={t.databaseId} href={`/admin/tickets/${t.databaseId}`} className="block border-b border-brand-surface_hover py-3 last:border-0 hover:bg-white/[.015]"><div className="truncate text-xs font-black text-white">{t.title}</div><div className="mt-1 text-[10px] text-brand-m_khonsa">{TICKET_STATUS_LABELS[t.status] ?? t.status} · #{t.databaseId}</div></Link>)}{!data.tickets?.length&&<AdminEmpty title="تیکتی ثبت نشده است."/>}</Collection>
        <Collection icon={<MessageSquare size={17}/>} title="دیدگاه‌های اخیر">{data.reviews?.map((r:any)=><div key={r.databaseId} className="border-b border-brand-surface_hover py-3 last:border-0"><div className="text-xs font-bold text-white">{r.productName||"محصول"}</div><div className="mt-1 text-[10px] text-brand-m_khonsa">{r.rating}/5 · {r.approved?"منتشرشده":"در انتظار بررسی"}</div><div className="mt-2 line-clamp-2 text-xs leading-5 text-white">{r.content}</div></div>)}{!data.reviews?.length&&<AdminEmpty title="دیدگاهی ثبت نشده است."/>}</Collection>
      </div>
    </div>
  </AdminPage>;
}

function Collection({title,icon,children}:{title:string;icon:ReactNode;children:ReactNode}){return <AdminCard className="overflow-hidden"><AdminSectionHeader icon={icon} title={title}/><div className="px-4">{children}</div></AdminCard>}
