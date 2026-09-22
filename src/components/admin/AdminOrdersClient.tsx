"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Eye } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminEmpty,
  AdminFilterBar,
  AdminMobileList,
  AdminPage,
  AdminPageIntro,
  AdminRefreshButton,
  AdminSearchInput,
  AdminSelect,
  AdminTable,
  AdminListCard,
} from "./AdminUi";

interface OrderNode {
  databaseId: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: string;
  currency: string;
  date: string;
  customerName: string;
  customerEmail: string;
}

const STATUS_LABEL: Record<string, string> = { processing: "در حال پردازش", completed: "تکمیل‌شده", all: "همه پرداخت‌شده‌ها" };
const FULFILLMENT_LABEL: Record<string, string> = { processing: "در حال پردازش", partially_fulfilled: "ناقص", fulfilled: "تحویل کامل", completed: "تکمیل‌شده", pending: "در انتظار" };

const statusTone = (status: string) => status === "completed" ? "success" : status === "cancelled" ? "danger" : status === "processing" ? "info" : "warning";

export default function AdminOrdersClient({ initial, permissions = [] }: { initial?: { nodes: OrderNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }; permissions?: string[] }) {
  const empty = { nodes: [] as OrderNode[], pageInfo: { hasNextPage: false, endCursor: null as string | null } };
  const [data, setData] = useState(initial ?? empty);
  const [effectivePermissions, setEffectivePermissions] = useState(permissions);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("processing");
  const [loading, setLoading] = useState(!initial);

  const load = async (after?: string | null) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status, search });
      if (after) qs.set("after", after);
      const response = await fetch(`/api/admin/orders?${qs.toString()}`, { cache: "no-store" });
      if (response.ok) setData(await response.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) return;
    void load();
    fetch("/api/admin/context", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((context) => { if (context?.permissions) setEffectivePermissions(context.permissions); })
      .catch(() => undefined);
  }, []);

  return (
    <AdminPage>
      <AdminPageIntro eyebrow="عملیات" title="سفارش‌ها" description="وضعیت پرداخت و fulfillment را سریع بررسی کن." action={<AdminRefreshButton onClick={() => void load()} loading={loading} />} />

      <AdminFilterBar>
        <AdminSearchInput value={search} onChange={setSearch} onEnter={() => void load()} placeholder="شناسه سفارش، نام یا ایمیل" />
        <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)} className="lg:w-[190px] lg:flex-none">
          <option value="processing">در حال پردازش</option><option value="completed">تکمیل‌شده</option><option value="all">همه پرداخت‌شده‌ها</option>
        </AdminSelect>
        <AdminButton variant="primary" onClick={() => void load()} className="lg:min-w-[96px]">جستجو</AdminButton>
      </AdminFilterBar>

      {data.nodes.length === 0 ? (
        <AdminEmpty title="سفارشی با این فیلتر پیدا نشد." />
      ) : (
        <>
          <AdminTable minWidth="1080px">
            <thead><tr><th>سفارش</th><th>مشتری</th><th>وضعیت</th><th>پرداخت</th><th>تحویل</th><th>مبلغ</th><th>تاریخ</th><th /></tr></thead>
            <tbody>
              {data.nodes.map((order) => (
                <tr key={order.databaseId}>
                  <td><div className="text-xs font-black text-white">#{order.orderNumber}</div><div className="mt-1 text-[9px] text-brand-m_khonsa">شناسه {order.databaseId}</div></td>
                  <td><div className="text-xs font-bold text-white">{order.customerName || "—"}</div><div className="mt-1 text-[9px] text-brand-m_khonsa" dir="ltr">{order.customerEmail || "—"}</div></td>
                  <td><AdminBadge tone={statusTone(order.status) as "success" | "danger" | "info" | "warning"}>{STATUS_LABEL[order.status] ?? order.status}</AdminBadge></td>
                  <td><AdminBadge tone={order.paymentStatus === "paid" ? "success" : "warning"}>{order.paymentStatus === "paid" ? "پرداخت‌شده" : order.paymentStatus}</AdminBadge></td>
                  <td><span className="text-[10px] font-bold text-white">{FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}</span></td>
                  <td><span className="text-[11px] font-black text-white" dir="ltr">{order.total} {order.currency}</span></td>
                  <td><span className="text-[9px] text-brand-m_khonsa" dir="ltr">{order.date ? new Date(order.date).toLocaleString("fa-IR") : "—"}</span></td>
                  <td><Link href={`/admin/orders/${order.databaseId}`} className="inline-flex items-center gap-1 text-[10px] font-black text-brand-blue hover:text-white"><Eye size={14} /> باز کردن</Link></td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <AdminMobileList>
            {data.nodes.map((order) => (
              <AdminListCard key={order.databaseId} href={`/admin/orders/${order.databaseId}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="text-sm font-black text-white">#{order.orderNumber}</div><div className="mt-1 truncate text-[10px] text-brand-m_khonsa">{order.customerName || "—"}</div></div>
                  <AdminBadge tone={statusTone(order.status) as "success" | "danger" | "info" | "warning"}>{STATUS_LABEL[order.status] ?? order.status}</AdminBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label="پرداخت" value={order.paymentStatus === "paid" ? "پرداخت‌شده" : order.paymentStatus} />
                  <Mini label="تحویل" value={FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus} />
                  <Mini label="مبلغ" value={`${order.total} ${order.currency}`} ltr />
                  <Mini label="تاریخ" value={order.date ? new Date(order.date).toLocaleDateString("fa-IR") : "—"} />
                </div>
              </AdminListCard>
            ))}
          </AdminMobileList>
        </>
      )}

      {data.pageInfo.hasNextPage && <div className="mt-4 flex justify-center"><AdminButton onClick={() => void load(data.pageInfo.endCursor)} disabled={loading}><ChevronLeft size={15} /> صفحه بعد</AdminButton></div>}
      {!effectivePermissions.includes("orders.write") && <div className="mt-3 text-[10px] text-brand-m_khonsa">این حساب فقط مجوز مشاهده دارد.</div>}
    </AdminPage>
  );
}

function Mini({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return <div><div className="text-[9px] text-brand-m_khonsa">{label}</div><div className="mt-1 truncate text-[10px] font-bold text-white" dir={ltr ? "ltr" : undefined}>{value}</div></div>;
}
