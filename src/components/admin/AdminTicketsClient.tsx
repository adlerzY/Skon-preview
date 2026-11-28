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
import { faDate } from "./format";
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS, ticketStatusTone } from "./labels";

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

const isUrgent = (priority: string) => priority === "urgent" || priority === "high";

export default function AdminTicketsClient({ initial }: { initial?: TicketsData }) {
  const router = useRouter();
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const [order, setOrder] = useState("desc");
  const params = useMemo(
    () => ({ status, search: search.trim(), mineOnly: mine ? "true" : "", order }),
    [status, search, mine, order]
  );

  const { data, loading, loadingMore, error, refresh, loadMore } = useAdminList<TicketsData>({
    endpoint: "/api/admin/tickets",
    params,
    initial,
  });

  const showSkeleton = loading && data.nodes.length === 0;
  const moreCount = (mine ? 1 : 0) + (order !== "desc" ? 1 : 0);

  return (
    <AdminPage>
      <AdminPageIntro
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
        <AdminMoreFilters activeCount={moreCount}>
          <AdminFilterField label="نمایش">
            <AdminSelect value={mine ? "mine" : "all"} onChange={(event) => setMine(event.target.value === "mine")}>
              <option value="all">همه تیکت‌ها</option>
              <option value="mine">فقط تیکت‌های من</option>
            </AdminSelect>
          </AdminFilterField>
          <AdminFilterField label="مرتب‌سازی">
            <AdminSelect value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="desc">جدیدترین</option>
              <option value="asc">قدیمی‌ترین (صف انتظار)</option>
            </AdminSelect>
          </AdminFilterField>
        </AdminMoreFilters>
      </AdminFilterBar>

      <AdminErrorBanner message={error} onRetry={() => void refresh()} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="تیکتی با این فیلتر پیدا نشد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />

          <AdminTable minWidth="820px">
            <thead>
              <tr>
                <th>تیکت</th>
                <th>مشتری</th>
                <th>وضعیت</th>
                <th>مسئول</th>
                <th>تاریخ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.nodes.map((ticket) => (
                <tr
                  key={ticket.databaseId}
                  onClick={() => router.push(`/admin/tickets/${ticket.databaseId}`)}
                  className="cursor-pointer"
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/tickets/${ticket.databaseId}`}
                        prefetch={false}
                        onClick={(event) => event.stopPropagation()}
                        className="max-w-[340px] truncate font-medium text-brand-active hover:text-brand-blue"
                      >
                        {ticket.title}
                      </Link>
                      {isUrgent(ticket.priority) ? (
                        <AdminBadge tone="danger">{TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</AdminBadge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[12px] text-brand-m_khonsa">#{ticket.databaseId.toLocaleString("fa-IR")}</div>
                  </td>
                  <td className="text-brand-active">{ticket.customerName || "—"}</td>
                  <td>
                    <AdminBadge tone={ticketStatusTone(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}</AdminBadge>
                  </td>
                  <td className="text-[13px] text-brand-m_khonsa">{ticket.assigneeName || "بدون مسئول"}</td>
                  <td className="text-[13px] text-brand-m_khonsa">{faDate(ticket.date)}</td>
                  <td className="w-8 text-brand-surface_m">
                    <ChevronLeft size={16} />
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
                    <div className="truncate text-[14px] font-medium text-brand-active">{ticket.title}</div>
                    <div className="mt-0.5 truncate text-[12px] text-brand-m_khonsa">
                      {ticket.customerName || "—"} · {faDate(ticket.date)}
                    </div>
                  </div>
                  <AdminBadge tone={ticketStatusTone(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}</AdminBadge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-brand-m_khonsa">
                  <span>{ticket.assigneeName || "بدون مسئول"}</span>
                  {isUrgent(ticket.priority) ? (
                    <AdminBadge tone="danger">{TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</AdminBadge>
                  ) : null}
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