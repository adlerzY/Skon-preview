"use client";

import Link from "next/link";
import { AlertCircle, ClipboardCheck, LifeBuoy, ShoppingCart, ArrowLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { AdminCard, AdminEmpty, AdminPage, AdminPageIntro, AdminRefreshButton, AdminStatCard } from "./AdminUi";
import { useAdminContext } from "./AdminContext";

export default function AdminDashboard({ initial }: { initial: {
  summary: { openTicketsCount: number; pendingReviewsCount: number; processingOrdersCount: number };
  pricingHealth?: { status?: string; apiConfigured?: boolean; apiHealthy?: boolean; apiStatus?: string; fallbackActive?: boolean; availableRates?: number; checkedAt?: number } | null;
  tickets: Array<{ id: string; databaseId: number; title: string; date?: string; linkedOrderId?: number | null; customerName?: string | null }>;
} }) {
  const { user, permissions } = useAdminContext();
  const [summary, setSummary] = useState(initial.summary);
  const [tickets, setTickets] = useState(initial.tickets);
  const [pricingHealth, setPricingHealth] = useState(initial.pricingHealth ?? null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasTickets = permissions.includes("tickets.read");
  const hasReviews = permissions.includes("reviews.moderate");
  const hasOrders = permissions.includes("orders.read");

  const refreshDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("dashboard_failed");
      const data = await response.json();
      setSummary({
        openTicketsCount: Number(data?.summary?.openTicketsCount ?? 0),
        pendingReviewsCount: Number(data?.summary?.pendingReviewsCount ?? 0),
        processingOrdersCount: Number(data?.summary?.processingOrdersCount ?? 0),
      });
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      setPricingHealth(data?.pricingHealth ?? null);
    } catch {
      // Keep the last known dashboard state when refresh fails.
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AdminPage>
      <AdminPageIntro
        eyebrow="مرکز عملیات"
        title={`سلام ${user?.name || "مدیر"}`}
        description="فقط مواردی که نیاز به اقدام دارند در اینجا نمایش داده می‌شوند."
        action={<AdminRefreshButton onClick={handleRefresh} loading={refreshing} />}
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {hasOrders ? <AdminStatCard label="سفارش‌های در حال پردازش" value={dashboardLoading ? "—" : summary.processingOrdersCount} helper="نیازمند پیگیری" tone="info" /> : null}
        {hasTickets ? <AdminStatCard label="تیکت‌های باز" value={dashboardLoading ? "—" : summary.openTicketsCount} helper="صف پشتیبانی" tone={summary.openTicketsCount ? "warning" : "default"} /> : null}
        {hasReviews ? <AdminStatCard label="دیدگاه‌های منتظر بررسی" value={dashboardLoading ? "—" : summary.pendingReviewsCount} helper="صف بررسی" tone={summary.pendingReviewsCount ? "warning" : "default"} /> : null}
      </div>

      {pricingHealth ? <AdminCard className="mt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-white">وضعیت Pricing Engine</div>
            <div className="mt-1 text-[10px] text-brand-m_khonsa">وضعیت منبع نرخ قبل از شروع عملیات قیمت‌گذاری.</div>
          </div>
          <HealthBadge status={pricingHealth.status} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <HealthMetric label="نرخ‌های آماده" value={`${Math.min(4, Number(pricingHealth.availableRates ?? 0))}/4`} />
          <HealthMetric label="API" value={pricingHealth.apiConfigured ? (pricingHealth.apiHealthy ? "Healthy" : "Down") : "Manual"} />
          <HealthMetric label="Fallback" value={pricingHealth.fallbackActive ? "Active" : "Inactive"} />
        </div>
      </AdminCard> : null}

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
            {hasOrders ? <ActionTile href="/admin/orders" icon={<ShoppingCart size={17} />} value={summary.processingOrdersCount} title="سفارش در حال پردازش" detail="بررسی fulfillment" /> : null}
          </div>
        </AdminCard>

        {hasTickets ? <AdminCard className="overflow-hidden">
          <div className="border-b border-white/[.06] px-3 py-3">
            <div className="text-sm font-black text-white">تیکت‌های باز اخیر</div>
            <div className="mt-1 text-[10px] text-brand-m_khonsa">فقط چند مورد اخیر برای تصمیم سریع.</div>
          </div>
          {tickets.length === 0 ? (
            <AdminEmpty title={dashboardLoading ? "در حال دریافت اطلاعات…" : "تیکت بازی وجود ندارد."} />
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
        </AdminCard> : null}
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


function HealthBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    healthy: { label: "API Healthy", className: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
    partial: { label: "API Partial", className: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
    fallback: { label: "Fallback Active", className: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
    manual: { label: "Manual Pricing Mode", className: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" },
    failed: { label: "API Failed", className: "text-red-300 bg-red-400/10 border-red-400/20" },
  };
  const item = map[status ?? "failed"] ?? map.failed;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black ${item.className}`}>{item.label}</span>;
}

function HealthMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[5px] border border-white/[.06] bg-black/10 p-2.5"><div className="text-[9px] text-brand-m_khonsa">{label}</div><div className="mt-1 text-xs font-black text-white">{value}</div></div>;
}
