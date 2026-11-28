"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
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
import AdminMoreFilters, { AdminFilterField } from "./AdminMoreFilters";
import { useAdminContext } from "./AdminContext";
import { useAdminList, type AdminListData } from "./useAdminList";
import { faDate } from "./format";
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS, fulfillmentTone, orderStatusTone } from "./labels";

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

export default function AdminOrdersClient({
  initial,
  permissions = [],
}: {
  initial?: OrdersData;
  permissions?: string[];
}) {
  const router = useRouter();
  const context = useAdminContext();
  const effectivePermissions = permissions.length ? permissions : context.permissions;
  const [status, setStatus] = useState("processing");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const params = useMemo(() => ({ status, search: search.trim(), order }), [status, search, order]);

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<OrdersData>({
    endpoint: "/api/admin/orders",
    params,
    initial,
  });

  const showSkeleton = loading && data.nodes.length === 0;

  return (
    <AdminPage>
      <AdminPageIntro
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
        <AdminMoreFilters activeCount={order !== "desc" ? 1 : 0}>
          <AdminFilterField label="مرتب‌سازی">
            <AdminSelect value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="desc">جدیدترین</option>
              <option value="asc">قدیمی‌ترین</option>
            </AdminSelect>
          </AdminFilterField>
        </AdminMoreFilters>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="سفارشی با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="860px">
            <thead>
              <tr>
                <th>سفارش</th>
                <th>مشتری</th>
                <th>وضعیت</th>
                <th>تحویل</th>
                <th>مبلغ</th>
                <th>تاریخ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((item) => (
                <tr
                  key={item.databaseId}
                  onClick={() => router.push(`/admin/orders/${item.databaseId}`)}
                  className="cursor-pointer"
                >
                  <td>
                    <Link
                      href={`/admin/orders/${item.databaseId}`}
                      prefetch={false}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-brand-active hover:text-brand-blue"
                    >
                      #{item.orderNumber}
                    </Link>
                    {item.paymentStatus !== "paid" ? (
                      <div className="mt-1">
                        <AdminBadge tone="warning">پرداخت‌نشده</AdminBadge>
                      </div>
                    ) : null}
                  </td>
                  <td className="text-brand-active">{item.customerName || "—"}</td>
                  <td>
                    <AdminBadge tone={orderStatusTone(item.status)}>{ORDER_STATUS_LABELS[item.status] ?? item.status}</AdminBadge>
                  </td>
                  <td>
                    <AdminBadge tone={fulfillmentTone(item.fulfillmentStatus)}>
                      {FULFILLMENT_LABELS[item.fulfillmentStatus] ?? item.fulfillmentStatus}
                    </AdminBadge>
                  </td>
                  <td className="text-brand-active" dir="ltr">
                    {item.total} {item.currency}
                  </td>
                  <td className="text-[13px] text-brand-m_khonsa">{faDate(item.date)}</td>
                  <td className="w-8 text-brand-surface_m">
                    <ChevronLeft size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <AdminMobileList>
            {data.nodes.map((item) => (
              <AdminListCard key={item.databaseId} href={`/admin/orders/${item.databaseId}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-brand-active">#{item.orderNumber}</div>
                    <div className="mt-0.5 truncate text-[12px] text-brand-m_khonsa">
                      {item.customerName || "—"} · {faDate(item.date)}
                    </div>
                  </div>
                  <AdminBadge tone={orderStatusTone(item.status)}>{ORDER_STATUS_LABELS[item.status] ?? item.status}</AdminBadge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <AdminBadge tone={fulfillmentTone(item.fulfillmentStatus)}>
                    {FULFILLMENT_LABELS[item.fulfillmentStatus] ?? item.fulfillmentStatus}
                  </AdminBadge>
                  <span className="text-[13px] text-brand-active" dir="ltr">
                    {item.total} {item.currency}
                  </span>
                </div>
              </AdminListCard>
            ))}
          </AdminMobileList>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />

      {!effectivePermissions.includes("orders.write") ? (
        <div className="mt-4 text-[12px] text-brand-m_khonsa">این حساب فقط مجوز مشاهده دارد.</div>
      ) : null}
    </AdminPage>
  );
}