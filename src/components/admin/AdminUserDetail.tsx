import Link from "next/link";
import { ArrowRight, LifeBuoy, Package } from "lucide-react";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminFieldRow,
  AdminPage,
  AdminPageIntro,
  AdminSectionHeader,
  AdminStatCard,
} from "./AdminUi";
import { faDate, faDateTime } from "./format";

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

const ORDER_STATUS: Record<string, string> = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  "on-hold": "در انتظار اقدام",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
  refunded: "مستردشده",
  failed: "ناموفق",
};

const TICKET_STATUS: Record<string, string> = {
  open: "باز",
  claimed: "در اختیار ادمین",
  waiting_user: "در انتظار کاربر",
  waiting_staff: "در انتظار پشتیبانی",
  resolved: "حل‌شده",
  closed: "بسته‌شده",
};

const orderTone = (status: string): "success" | "danger" | "info" | "warning" =>
  status === "completed" ? "success" : status === "cancelled" || status === "failed" ? "danger" : status === "processing" ? "info" : "warning";

const ticketTone = (status: string): "success" | "warning" | "info" =>
  status === "resolved" || status === "closed" ? "success" : status === "open" ? "warning" : "info";

export default function AdminUserDetail({ data, permissions }: { data: Detail; permissions: string[] }) {
  const { user } = data;
  const canOrders = permissions.includes("orders.read");
  const canTickets = permissions.includes("tickets.read");

  return (
    <AdminPage>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/admin/users" prefetch={false} className="inline-flex items-center gap-2 text-sm font-bold text-brand-m_khonsa hover:text-white">
          <ArrowRight size={15} /> بازگشت به کاربران
        </Link>
        {user.isStaff && <AdminBadge tone="info">عضو تیم</AdminBadge>}
      </div>

      <AdminPageIntro eyebrow="پرونده کاربر" title={user.name || `کاربر #${user.databaseId}`} description={`شناسه #${user.databaseId}`} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="سفارش موفق" value={user.paidOrdersCount} tone="success" />
        <AdminStatCard label="تیکت" value={user.ticketsCount} />
        <AdminStatCard label="دیدگاه" value={user.reviewsCount} />
        <AdminStatCard label="آخرین فعالیت" value={faDate(user.lastActive)} helper={user.lastActive ? faDateTime(user.lastActive) : "نشستی ثبت نشده"} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="space-y-4">
          {canOrders && (
            <AdminCard className="overflow-hidden">
              <AdminSectionHeader icon={<Package size={17} />} title="آخرین سفارش‌ها" description="۱۰ سفارش اخیر این کاربر" />
              <div className="divide-y divide-brand-surface_hover px-4">
                {data.recentOrders.map((order) => (
                  <Link
                    key={order.databaseId}
                    href={`/admin/orders/${order.databaseId}`}
                    prefetch={false}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-white/[.015]"
                  >
                    <div>
                      <div className="text-sm font-black text-white">#{order.orderNumber}</div>
                      <div className="mt-1 text-xs text-brand-m_khonsa">{faDateTime(order.date)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white" dir="ltr">{order.total} {order.currency}</span>
                      <AdminBadge tone={orderTone(order.status)}>{ORDER_STATUS[order.status] ?? order.status}</AdminBadge>
                    </div>
                  </Link>
                ))}
              </div>
              {data.recentOrders.length === 0 && (
                <div className="p-4">
                  <AdminEmpty title="سفارشی ثبت نشده است." />
                </div>
              )}
            </AdminCard>
          )}

          {canTickets && (
            <AdminCard className="overflow-hidden">
              <AdminSectionHeader icon={<LifeBuoy size={17} />} title="آخرین تیکت‌ها" description="۱۰ تیکت اخیر این کاربر" />
              <div className="divide-y divide-brand-surface_hover px-4">
                {data.recentTickets.map((ticket) => (
                  <Link
                    key={ticket.databaseId}
                    href={`/admin/tickets/${ticket.databaseId}`}
                    prefetch={false}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-white/[.015]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-white">{ticket.title}</div>
                      <div className="mt-1 text-xs text-brand-m_khonsa">#{ticket.databaseId} · {faDateTime(ticket.date)}</div>
                    </div>
                    <AdminBadge tone={ticketTone(ticket.status)}>{TICKET_STATUS[ticket.status] ?? ticket.status}</AdminBadge>
                  </Link>
                ))}
              </div>
              {data.recentTickets.length === 0 && (
                <div className="p-4">
                  <AdminEmpty title="تیکتی ثبت نشده است." />
                </div>
              )}
            </AdminCard>
          )}

          {!canOrders && !canTickets && <AdminEmpty title="برای مشاهده سفارش‌ها و تیکت‌ها مجوز لازم را ندارید." />}
        </div>

        <div className="space-y-4">
          <AdminCard className="overflow-hidden">
            <AdminSectionHeader title="اطلاعات تماس" />
            <div className="p-4">
              <AdminFieldRow label="نام" value={user.name || "—"} ltr={false} />
              <AdminFieldRow label="ایمیل" value={user.email || "—"} />
              <AdminFieldRow label="موبایل" value={user.phone || "—"} />
              <AdminFieldRow label="تاریخ عضویت" value={faDate(user.registeredAt)} ltr={false} />
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminPage>
  );
}