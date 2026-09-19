"use client";

import Link from "next/link";
import { AlertCircle, ClipboardCheck, LifeBuoy, ShoppingCart, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AdminCard, AdminEmpty, AdminPage, AdminPageIntro, AdminRefreshButton, AdminStatCard } from "./AdminUi";
import { useAdminContext } from "./AdminContext";

export default function AdminDashboard() {
  const { user, permissions, summary, tickets, loading, refresh } = useAdminContext();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const hasTickets = permissions.includes("tickets.read");
  const hasReviews = permissions.includes("reviews.moderate");

  return (
    <AdminPage>
      <AdminPageIntro
        eyebrow="مرکز عملیات"
        title={`سلام ${user?.name || "مدیر"}`}
        description="فقط مواردی که نیاز به اقدام دارند در اینجا نمایش داده می‌شوند."
        action={<AdminRefreshButton onClick={handleRefresh} loading={refreshing} />}
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard label="سفارش‌های در حال پردازش" value={loading ? "—" : summary.processingOrdersCount} helper="نیازمند پیگیری" tone="info" />
        <AdminStatCard label="تیکت‌های باز" value={loading ? "—" : summary.openTicketsCount} helper="صف پشتیبانی" tone={summary.openTicketsCount ? "warning" : "default"} />
        <AdminStatCard label="دیدگاه‌های منتظر بررسی" value={loading ? "—" : summary.pendingReviewsCount} helper="صف بررسی" tone={summary.pendingReviewsCount ? "warning" : "default"} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/[.06] px-3 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-white"><AlertCircle size={15} className="text-brand-zard" /> نیازمند اقدام</div>
              <div className="mt-1 text-[10px] text-brand-m_khonsa">موارد مهم مستقیم به صف مربوط هدایت می‌کنند.</div>
            </div>
          </div>
          <div className="grid gap-px bg-white/[.045] sm:grid-cols-2">
            {hasTickets ? <ActionTile href="/admin/tickets" icon={<LifeBuoy size={17} />} value={summary.openTicketsCount} title="تیکت باز" detail="صف پشتیبانی" /> : null}
            {hasReviews ? <ActionTile href="/admin/reviews" icon={<ClipboardCheck size={17} />} value={summary.pendingReviewsCount} title="دیدگاه منتظر بررسی" detail="صف moderation" /> : null}
            <ActionTile href="/admin/orders" icon={<ShoppingCart size={17} />} value={summary.processingOrdersCount} title="سفارش در حال پردازش" detail="بررسی fulfillment" />
          </div>
        </AdminCard>

        <AdminCard className="overflow-hidden">
          <div className="border-b border-white/[.06] px-3 py-3">
            <div className="text-sm font-black text-white">تیکت‌های باز اخیر</div>
            <div className="mt-1 text-[10px] text-brand-m_khonsa">فقط چند مورد اخیر برای تصمیم سریع.</div>
          </div>
          {tickets.length === 0 ? (
            <AdminEmpty title={loading ? "در حال دریافت اطلاعات…" : "تیکت بازی وجود ندارد."} />
          ) : (
            <div>
              {tickets.slice(0, 5).map((ticket) => (
                <Link prefetch={false} key={ticket.id} href={`/admin/tickets/${ticket.databaseId}`} className="block border-b border-white/[.055] px-4 py-3 last:border-0 hover:bg-white/[.02]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-black text-white">{ticket.title}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-brand-m_khonsa">
                        {ticket.customerName && <span>{ticket.customerName}</span>}
                        {ticket.linkedOrderId && <span>سفارش #{ticket.linkedOrderId}</span>}
                      </div>
                    </div>
                    <ArrowLeft size={14} className="mt-0.5 shrink-0 text-brand-m_khonsa" />
                  </div>
                </Link>
              ))}
              <div className="px-4 py-3">
                <Link prefetch={false} href="/admin/tickets" className="text-[11px] font-black text-brand-blue hover:text-white">مشاهده همه تیکت‌ها</Link>
              </div>
            </div>
          )}
        </AdminCard>
      </div>
    </AdminPage>
  );
}

function ActionTile({ href, icon, value, title, detail }: { href: string; icon: React.ReactNode; value: number; title: string; detail: string }) {
  return (
    <Link prefetch={false} href={href} className="group bg-brand-surface p-3 transition hover:bg-white/[.025]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-brand-blue">{icon}</span>
        <span className="text-2xl font-black text-white">{value.toLocaleString("fa-IR")}</span>
      </div>
      <div className="mt-2 text-xs font-bold text-white">{title}</div>
      <div className="mt-1 text-[10px] text-brand-m_khonsa group-hover:text-white">{detail}</div>
    </Link>
  );
}
