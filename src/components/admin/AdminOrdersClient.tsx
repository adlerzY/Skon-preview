"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import {
  AdminBadge,
  AdminEmpty,
  AdminFilterBar,
  AdminListCard,
  AdminMobileList,
  AdminPage,
  AdminPageIntro,
  AdminRefreshButton,
  AdminSearchInput,
  AdminSelect,
  AdminTable,
} from "./AdminUi";
import { AdminErrorBanner, AdminListCount, AdminLoadMore, AdminSkeletonRows } from "./AdminListParts";
import { useAdminContext } from "./AdminContext";
import { useAdminList, type AdminListData } from "./useAdminList";

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

type OrdersData = AdminListData<OrderNode>;

const STATUS_LABEL: Record<string, string> = {
  processing: "در حال پردازش",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
  pending: "در انتظار",
  "on-hold": "در انتظار اقدام",
  refunded: "مستردشده",
  failed: "ناموفق",
};

const FULFILLMENT_LABEL: Record<string, string> = {
  queued: "در صف",
  processing: "در حال تکمیل",
  completed: "تکمیل کامل",
};

type Tone = "success" | "danger" | "info" | "warning";

const statusTone = (status: string): Tone =>
  status === "completed" ? "success" : status === "cancelled" || status === "failed" ? "danger" : status === "processing" ? "info" : "warning";

const formatDate = (value: string) => (value ? new Date(value).toLocaleString("fa-IR") : "—");

export default function AdminOrdersClient({
  initial,
  permissions = [],
}: {
  initial?: OrdersData;
  permissions?: string[];
}) {
  const context = useAdminContext();
  const effectivePermissions = permissions.length ? permissions : context.permissions;
  const [status, setStatus] = useState("processing");
  const [search, setSearch] = useState("");
  const params = useMemo(() => ({ status, search: search.trim() }), [status, search]);

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<OrdersData>({
    endpoint: "/api/admin/orders",
    params,
    initial,
  });

  const showSkeleton = loading && data.nodes.length === 0;

  return (
    <AdminPage>
      <AdminPageIntro
        eyebrow="عملیات"
        title="سفارش‌ها"
        description="وضعیت پرداخت و تحویل سفارش‌ها را سریع بررسی کن."
        action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />}
      />

      <AdminFilterBar>
        <AdminSearchInput value={search} onChange={setSearch} placeholder="شناسه سفارش، نام یا ایمیل" />
        <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)} className="lg:w-[200px] lg:flex-none">
          <option value="processing">در حال پردازش</option>
          <option value="completed">تکمیل‌شده</option>
          <option value="all">همه پرداخت‌شده‌ها</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="سفارشی با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="1080px">
            <thead>
              <tr>
                <th>سفارش</th>
                <th>مشتری</th>
                <th>وضعیت</th>
                <th>پرداخت</th>
                <th>تحویل</th>
                <th>مبلغ</th>
                <th>تاریخ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((order) => (
                <tr key={order.databaseId}>
                  <td>
                    <div className="text-sm font-black text-white">#{order.orderNumber}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa">شناسه {order.databaseId}</div>
                  </td>
                  <td>
                    <div className="text-sm font-bold text-white">{order.customerName || "—"}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">{order.customerEmail || "—"}</div>
                  </td>
                  <td>
                    <AdminBadge tone={statusTone(order.status)}>{STATUS_LABEL[order.status] ?? order.status}</AdminBadge>
                  </td>
                  <td>
                    <AdminBadge tone={order.paymentStatus === "paid" ? "success" : "warning"}>
                      {order.paymentStatus === "paid" ? "پرداخت‌شده" : "پرداخت‌نشده"}
                    </AdminBadge>
                  </td>
                  <td>
                    <AdminBadge tone={order.fulfillmentStatus === "completed" ? "success" : "info"}>
                      {FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                    </AdminBadge>
                  </td>
                  <td>
                    <span className="text-sm font-black text-white" dir="ltr">{order.total} {order.currency}</span>
                  </td>
                  <td>
                    <span className="text-xs text-brand-m_khonsa">{formatDate(order.date)}</span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/orders/${order.databaseId}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 text-xs font-black text-brand-blue hover:text-white"
                    >
                      <Eye size={14} /> باز کردن
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <AdminMobileList>
            {data.nodes.map((order) => (
              <AdminListCard key={order.databaseId} href={`/admin/orders/${order.databaseId}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white">#{order.orderNumber}</div>
                    <div className="mt-1 truncate text-xs text-brand-m_khonsa">{order.customerName || "—"}</div>
                  </div>
                  <AdminBadge tone={statusTone(order.status)}>{STATUS_LABEL[order.status] ?? order.status}</AdminBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label="پرداخت" value={order.paymentStatus === "paid" ? "پرداخت‌شده" : "پرداخت‌نشده"} />
                  <Mini label="تحویل" value={FULFILLMENT_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus} />
                  <Mini label="مبلغ" value={`${order.total} ${order.currency}`} ltr />
                  <Mini label="تاریخ" value={order.date ? new Date(order.date).toLocaleDateString("fa-IR") : "—"} />
                </div>
              </AdminListCard>
            ))}
          </AdminMobileList>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />

      {!effectivePermissions.includes("orders.write") && (
        <div className="mt-3 text-xs text-brand-m_khonsa">این حساب فقط مجوز مشاهده دارد.</div>
      )}
    </AdminPage>
  );
}

function Mini({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <div className="text-xs text-brand-m_khonsa">{label}</div>
      <div className="mt-1 truncate text-xs font-bold text-white" dir={ltr ? "ltr" : undefined}>{value}</div>
    </div>
  );
}