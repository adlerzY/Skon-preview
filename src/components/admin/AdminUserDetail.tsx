import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminFieldRow,
  AdminPage,
  AdminPageIntro,
  AdminSectionHeader,
} from "./AdminUi";
import { faDate, faDateTime, faNumber } from "./format";
import { ORDER_STATUS_LABELS, TICKET_STATUS_LABELS, orderStatusTone, ticketStatusTone } from "./labels";

interface UserInfo {
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

interface Detail {
  user: UserInfo;
  recentOrders: Array<{ databaseId: number; orderNumber: string; status: string; total: string; currency: string; date: string | null }>;
  recentTickets: Array<{ databaseId: number; title: string; status: string; date: string | null }>;
}

export default function AdminUserDetail({ data, permissions }: { data: Detail; permissions: string[] }) {
  const { user } = data;
  const canOrders = permissions.includes("orders.read");
  const canTickets = permissions.includes("tickets.read");

  return (
    <AdminPage>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/users" prefetch={false} className="inline-flex items-center gap-2 text-[13px] text-brand-m_khonsa hover:text-brand-white">
          <ArrowRight size={15} /> بازگشت به کاربران
        </Link>
        {user.isStaff ? <AdminBadge tone="info">عضو تیم</AdminBadge> : null}
      </div>

      <AdminPageIntro title={user.name || `کاربر #${user.databaseId}`} description={`شناسه #${faNumber(user.databaseId)}`} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-4">
          {canOrders ? (
            <AdminCard className="overflow-hidden">
              <AdminSectionHeader title="آخرین سفارش‌ها" description="۱۰ سفارش اخیر این کاربر" />
              {data.recentOrders.length === 0 ? (
                <AdminEmpty title="سفارشی ثبت نشده است." />
              ) : (
                data.recentOrders.map((order) => (
                  <Link
                    key={order.databaseId}
                    href={`/admin/orders/${order.databaseId}`}
                    prefetch={false}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-surface_hover px-4 py-3 transition-colors last:border-b-0 hover:bg-brand-surface_hover/40"
                  >
                    <div>
                      <div className="text-[14px] font-medium text-brand-active">#{order.orderNumber}</div>
                      <div className="mt-0.5 text-[12px] text-brand-m_khonsa">{faDateTime(order.date)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-brand-active" dir="ltr">
                        {order.total} {order.currency}
                      </span>
                      <AdminBadge tone={orderStatusTone(order.status)}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</AdminBadge>
                    </div>
                  </Link>
                ))
              )}
            </AdminCard>
          ) : null}

          {canTickets ? (
            <AdminCard className="overflow-hidden">
              <AdminSectionHeader title="آخرین تیکت‌ها" description="۱۰ تیکت اخیر این کاربر" />
              {data.recentTickets.length === 0 ? (
                <AdminEmpty title="تیکتی ثبت نشده است." />
              ) : (
                data.recentTickets.map((ticket) => (
                  <Link
                    key={ticket.databaseId}
                    href={`/admin/tickets/${ticket.databaseId}`}
                    prefetch={false}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-surface_hover px-4 py-3 transition-colors last:border-b-0 hover:bg-brand-surface_hover/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-brand-active">{ticket.title}</div>
                      <div className="mt-0.5 text-[12px] text-brand-m_khonsa">
                        #{faNumber(ticket.databaseId)} · {faDateTime(ticket.date)}
                      </div>
                    </div>
                    <AdminBadge tone={ticketStatusTone(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}</AdminBadge>
                  </Link>
                ))
              )}
            </AdminCard>
          ) : null}

          {!canOrders && !canTickets ? <AdminEmpty title="برای مشاهده سفارش‌ها و تیکت‌ها مجوز لازم را ندارید." /> : null}
        </div>

        <AdminCard className="h-fit overflow-hidden">
          <AdminSectionHeader title="اطلاعات کاربر" />
          <div className="px-4 py-1">
            <AdminFieldRow label="نام" value={user.name || "—"} ltr={false} />
            <AdminFieldRow label="ایمیل" value={user.email || "—"} />
            <AdminFieldRow label="موبایل" value={user.phone || "—"} />
            <AdminFieldRow label="تاریخ عضویت" value={faDate(user.registeredAt)} ltr={false} />
            <AdminFieldRow label="آخرین فعالیت" value={user.lastActive ? faDateTime(user.lastActive) : "نشستی ثبت نشده"} ltr={false} />
            <AdminFieldRow label="سفارش موفق" value={faNumber(user.paidOrdersCount)} ltr={false} />
            <AdminFieldRow label="تیکت" value={faNumber(user.ticketsCount)} ltr={false} />
            <AdminFieldRow label="دیدگاه" value={faNumber(user.reviewsCount)} ltr={false} />
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}