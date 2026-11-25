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

const STATUS: Record<string, string> = {
  open: "باز",
  claimed: "در اختیار ادمین",
  waiting_user: "در انتظار کاربر",
  waiting_staff: "در انتظار پشتیبانی",
  resolved: "حل‌شده",
  closed: "بسته‌شده",
};

const PRIORITY: Record<string, string> = { low: "کم", normal: "عادی", high: "زیاد", urgent: "فوری" };

interface Ticket {
  databaseId: number;
  title: string;
  date: string;
  status: string;
  priority: string;
  customerName: string;
  customerEmail: string;
  linkedOrderId: number | null;
  assigneeName: string | null;
  claimExpiresAt: string | null;
}

type TicketsData = AdminListData<Ticket>;

const statusTone = (value: string): "success" | "warning" | "info" =>
  value === "resolved" || value === "closed" ? "success" : value === "open" ? "warning" : "info";

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString("fa-IR") : "—");

export default function AdminTicketsClient({ initial }: { initial?: TicketsData }) {
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const params = useMemo(
    () => ({ status, search: search.trim(), mineOnly: mine ? "true" : "" }),
    [status, search, mine]
  );

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<TicketsData>({
    endpoint: "/api/admin/tickets",
    params,
    initial,
  });

  const showSkeleton = loading && data.nodes.length === 0;

  return (
    <AdminPage>
      <AdminPageIntro
        eyebrow="پشتیبانی"
        title="تیکت‌ها"
        description="صف پشتیبانی را مدیریت کن، مسئولیت تیکت را بگیر و وضعیت را جلو ببر."
        action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />}
      />

      <AdminFilterBar>
        <AdminSearchInput value={search} onChange={setSearch} placeholder="عنوان یا متن تیکت" />
        <AdminSelect value={status} onChange={(event) => setStatus(event.target.value)} className="lg:w-[200px] lg:flex-none">
          <option value="open">باز</option>
          <option value="claimed">در اختیار ادمین</option>
          <option value="waiting_user">در انتظار کاربر</option>
          <option value="waiting_staff">در انتظار پشتیبانی</option>
          <option value="resolved">حل‌شده</option>
          <option value="closed">بسته‌شده</option>
          <option value="all">همه</option>
        </AdminSelect>
        <AdminSelect value={mine ? "mine" : "all"} onChange={(event) => setMine(event.target.value === "mine")} className="lg:w-[200px] lg:flex-none">
          <option value="all">همه تیکت‌ها</option>
          <option value="mine">فقط تیکت‌های من</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="تیکتی با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="1040px">
            <thead>
              <tr>
                <th>تیکت</th>
                <th>مشتری</th>
                <th>وضعیت</th>
                <th>اولویت</th>
                <th>مسئول</th>
                <th>سفارش</th>
                <th>تاریخ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((ticket) => (
                <tr key={ticket.databaseId}>
                  <td>
                    <div className="max-w-[320px] truncate text-sm font-black text-white">{ticket.title}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa">#{ticket.databaseId}</div>
                  </td>
                  <td>
                    <div className="text-sm font-bold text-white">{ticket.customerName || "—"}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa" dir="ltr">{ticket.customerEmail || "—"}</div>
                  </td>
                  <td>
                    <AdminBadge tone={statusTone(ticket.status)}>{STATUS[ticket.status] ?? ticket.status}</AdminBadge>
                  </td>
                  <td>
                    <AdminBadge tone={ticket.priority === "urgent" || ticket.priority === "high" ? "danger" : "neutral"}>
                      {PRIORITY[ticket.priority] ?? ticket.priority}
                    </AdminBadge>
                  </td>
                  <td>
                    <span className="text-xs text-white">{ticket.assigneeName || "بدون مسئول"}</span>
                  </td>
                  <td>
                    {ticket.linkedOrderId ? (
                      <Link href={`/admin/orders/${ticket.linkedOrderId}`} prefetch={false} className="text-xs font-bold text-brand-blue hover:text-white">
                        #{ticket.linkedOrderId}
                      </Link>
                    ) : (
                      <span className="text-xs text-brand-m_khonsa">—</span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-brand-m_khonsa">{formatDate(ticket.date)}</span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/tickets/${ticket.databaseId}`}
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
            {data.nodes.map((ticket) => (
              <AdminListCard key={ticket.databaseId} href={`/admin/tickets/${ticket.databaseId}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">{ticket.title}</div>
                    <div className="mt-1 text-xs text-brand-m_khonsa">{ticket.customerName || "—"} · #{ticket.databaseId}</div>
                  </div>
                  <AdminBadge tone={statusTone(ticket.status)}>{STATUS[ticket.status] ?? ticket.status}</AdminBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label="اولویت" value={PRIORITY[ticket.priority] ?? ticket.priority} />
                  <Mini label="مسئول" value={ticket.assigneeName || "بدون مسئول"} />
                  <Mini label="سفارش" value={ticket.linkedOrderId ? `#${ticket.linkedOrderId}` : "—"} />
                  <Mini label="تاریخ" value={formatDate(ticket.date)} />
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