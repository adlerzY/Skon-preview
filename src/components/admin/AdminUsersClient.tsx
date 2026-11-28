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
import { useAdminList, type AdminListData } from "./useAdminList";
import { faDate, faNumber } from "./format";

interface UserRow {
  databaseId: number;
  name: string;
  email: string | null;
  phone: string | null;
  registeredAt: string | null;
  isStaff: boolean;
  paidOrdersCount: number;
  ticketsCount: number;
  reviewsCount: number;
  lastActive: string | null;
}

type UsersData = AdminListData<UserRow>;

const contactLine = (user: UserRow) => user.email || user.phone || "—";

export default function AdminUsersClient({ initial }: { initial?: UsersData }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("all");
  const [order, setOrder] = useState("desc");
  const params = useMemo(() => ({ search: search.trim(), segment, order }), [search, segment, order]);

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<UsersData>({
    endpoint: "/api/admin/users",
    params,
    initial,
  });

  const showSkeleton = loading && data.nodes.length === 0;

  return (
    <AdminPage>
      <AdminPageIntro
        title="کاربران"
        description="مشتری‌ها و اعضای تیم را جست‌وجو کن و سابقه سفارش و تیکت‌هایشان را ببین."
        action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />}
      />

      <AdminFilterBar>
        <AdminSearchInput value={search} onChange={setSearch} placeholder="نام، ایمیل، موبایل یا شناسه کاربر" />
        <AdminSelect value={segment} onChange={(event) => setSegment(event.target.value)} className="lg:w-[200px] lg:flex-none">
          <option value="all">همه کاربران</option>
          <option value="customers">مشتری‌ها</option>
          <option value="staff">اعضای تیم</option>
        </AdminSelect>
        <AdminMoreFilters activeCount={order !== "desc" ? 1 : 0}>
          <AdminFilterField label="مرتب‌سازی">
            <AdminSelect value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="desc">جدیدترین عضو</option>
              <option value="asc">قدیمی‌ترین عضو</option>
            </AdminSelect>
          </AdminFilterField>
        </AdminMoreFilters>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="کاربری با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="760px">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>عضویت</th>
                <th>سفارش موفق</th>
                <th>آخرین فعالیت</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((user) => (
                <tr key={user.databaseId} onClick={() => router.push(`/admin/users/${user.databaseId}`)} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${user.databaseId}`}
                        prefetch={false}
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium text-brand-active hover:text-brand-blue"
                      >
                        {user.name || "—"}
                      </Link>
                      {user.isStaff ? <AdminBadge tone="info">تیم</AdminBadge> : null}
                    </div>
                    <div className="mt-0.5 text-[12px] text-brand-m_khonsa" dir="ltr">
                      {contactLine(user)}
                    </div>
                  </td>
                  <td className="text-[13px] text-brand-m_khonsa">{faDate(user.registeredAt)}</td>
                  <td className="text-brand-active">{faNumber(user.paidOrdersCount)}</td>
                  <td className="text-[13px] text-brand-m_khonsa">{faDate(user.lastActive)}</td>
                  <td className="w-8 text-brand-surface_m">
                    <ChevronLeft size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <AdminMobileList>
            {data.nodes.map((user) => (
              <AdminListCard key={user.databaseId} href={`/admin/users/${user.databaseId}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-brand-active">{user.name || "—"}</div>
                    <div className="mt-0.5 truncate text-[12px] text-brand-m_khonsa" dir="ltr">
                      {contactLine(user)}
                    </div>
                  </div>
                  {user.isStaff ? <AdminBadge tone="info">تیم</AdminBadge> : null}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-brand-m_khonsa">
                  <span>{faNumber(user.paidOrdersCount)} سفارش موفق</span>
                  <span>عضویت {faDate(user.registeredAt)}</span>
                </div>
              </AdminListCard>
            ))}
          </AdminMobileList>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />
    </AdminPage>
  );
}