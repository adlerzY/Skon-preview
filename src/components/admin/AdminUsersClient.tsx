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
import { useAdminList, type AdminListData } from "./useAdminList";
import { faDate, faDateTime, faNumber } from "./format";

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

export default function AdminUsersClient({ initial }: { initial?: UsersData }) {
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
        eyebrow="عملیات"
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
        <AdminSelect value={order} onChange={(event) => setOrder(event.target.value)} className="lg:w-[200px] lg:flex-none">
          <option value="desc">جدیدترین عضو</option>
          <option value="asc">قدیمی‌ترین عضو</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="کاربری با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="1100px">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>موبایل</th>
                <th>عضویت</th>
                <th>سفارش موفق</th>
                <th>تیکت</th>
                <th>دیدگاه</th>
                <th>آخرین فعالیت</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((user) => (
                <tr key={user.databaseId}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{user.name || "—"}</span>
                      {user.isStaff && <AdminBadge tone="info">تیم</AdminBadge>}
                    </div>
                    <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">{user.email || "—"}</div>
                  </td>
                  <td>
                    <span className="text-xs text-white" dir="ltr">{user.phone || "—"}</span>
                  </td>
                  <td>
                    <span className="text-xs text-brand-m_khonsa">{faDate(user.registeredAt)}</span>
                  </td>
                  <td className="text-sm font-bold text-white">{faNumber(user.paidOrdersCount)}</td>
                  <td className="text-sm text-white">{faNumber(user.ticketsCount)}</td>
                  <td className="text-sm text-white">{faNumber(user.reviewsCount)}</td>
                  <td>
                    <span className="text-xs text-brand-m_khonsa">{faDateTime(user.lastActive)}</span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/users/${user.databaseId}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 text-xs font-black text-brand-blue hover:text-white"
                    >
                      <Eye size={14} /> مشاهده
                    </Link>
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
                    <div className="truncate text-sm font-black text-white">{user.name || "—"}</div>
                    <div className="mt-1 truncate text-xs text-brand-m_khonsa" dir="ltr">{user.email || user.phone || "—"}</div>
                  </div>
                  {user.isStaff && <AdminBadge tone="info">تیم</AdminBadge>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label="سفارش موفق" value={faNumber(user.paidOrdersCount)} />
                  <Mini label="تیکت" value={faNumber(user.ticketsCount)} />
                  <Mini label="عضویت" value={faDate(user.registeredAt)} />
                  <Mini label="آخرین فعالیت" value={faDate(user.lastActive)} />
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-brand-m_khonsa">{label}</div>
      <div className="mt-1 truncate text-xs font-bold text-white">{value}</div>
    </div>
  );
}