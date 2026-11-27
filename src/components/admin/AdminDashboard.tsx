"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import { AdminButton, AdminEmpty, AdminPage } from "./AdminUi";

type DashboardData = {
  summary: {
    openTicketsCount: number;
    pendingReviewsCount: number;
    processingOrdersCount: number;
  };
  pricingHealth?: {
    status?: string;
    apiConfigured?: boolean;
    apiHealthy?: boolean;
    apiStatus?: string;
    fallbackActive?: boolean;
    availableRates?: number;
    checkedAt?: number;
  } | null;
  tickets: Array<{
    id: string;
    databaseId: number;
    title: string;
    date?: string;
    linkedOrderId?: number | null;
    customerName?: string | null;
  }>;
};

const PRICING_STATUS: Record<string, string> = {
  healthy: "سالم",
  partial: "نیمه‌فعال",
  fallback: "حالت جایگزین فعال",
  manual: "تنظیم دستی",
  failed: "ناموفق",
};

export default function AdminDashboard({ initial }: { initial: DashboardData }) {
  const { user, permissions } = useAdminContext();
  const [data, setData] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  const hasTickets = permissions.includes("tickets.read");
  const hasReviews = permissions.includes("reviews.moderate");
  const hasOrders = permissions.includes("orders.read");

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(false);
    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("dashboard_failed");
      const result = await response.json();
      setData({
        summary: {
          openTicketsCount: Number(result?.summary?.openTicketsCount ?? 0),
          pendingReviewsCount: Number(result?.summary?.pendingReviewsCount ?? 0),
          processingOrdersCount: Number(result?.summary?.processingOrdersCount ?? 0),
        },
        pricingHealth: result?.pricingHealth ?? null,
        tickets: Array.isArray(result?.tickets) ? result.tickets : [],
      });
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const stats = [
    hasOrders ? { href: "/admin/orders", label: "سفارش‌های در حال پردازش", value: data.summary.processingOrdersCount } : null,
    hasTickets ? { href: "/admin/tickets", label: "تیکت‌های باز", value: data.summary.openTicketsCount } : null,
    hasReviews ? { href: "/admin/reviews", label: "دیدگاه‌های در انتظار بررسی", value: data.summary.pendingReviewsCount } : null,
  ].filter((item): item is { href: string; label: string; value: number } => item !== null);

  return (
    <AdminPage className="space-y-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold leading-7 text-brand-active">پیشخوان</h1>
          <p className="mt-0.5 truncate text-xs text-brand-m_khonsa">خوش آمدی {user?.name || "مدیر"}</p>
        </div>
        <AdminButton onClick={() => void refreshDashboard()} disabled={refreshing}>
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          بروزرسانی
        </AdminButton>
      </div>

      {stats.length > 0 ? (
        <section className="grid grid-cols-1 divide-y divide-brand-surface_hover border-y border-brand-surface_hover sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
          {stats.map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className="flex min-h-[68px] items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-brand-surface/60">
              <span className="text-xs text-brand-m_khonsa">{item.label}</span>
              <span className="text-lg font-semibold tabular-nums text-brand-active">{item.value.toLocaleString("fa-IR")}</span>
            </Link>
          ))}
        </section>
      ) : null}

      {refreshError ? (
        <div className="flex items-center justify-between gap-2 border-r-2 border-brand-zard bg-brand-zard/10 px-3 py-2 text-xs text-brand-zard">
          <span>بروزرسانی انجام نشد؛ اطلاعات قبلی نمایش داده می‌شود.</span>
          <button type="button" onClick={() => void refreshDashboard()} className="shrink-0 underline underline-offset-2">تلاش دوباره</button>
        </div>
      ) : null}

      {hasTickets ? (
        <section className="border-b border-brand-surface_hover">
          <details>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 text-xs text-brand-m_khonsa marker:content-none [&::-webkit-details-marker]:hidden">
              <span>تیکت‌های باز اخیر</span>
              <span className="flex items-center gap-2 text-brand-surface_m">
                {data.tickets.length.toLocaleString("fa-IR")}
                <ChevronDown size={14} />
              </span>
            </summary>
            {data.tickets.length === 0 ? (
              <AdminEmpty title="تیکت بازی برای نمایش وجود ندارد." />
            ) : (
              <div className="pb-2">
                {data.tickets.slice(0, 4).map((ticket) => (
                  <Link key={ticket.id} href={`/admin/tickets/${ticket.databaseId}`} prefetch={false} className="flex items-center justify-between gap-3 border-t border-brand-surface_hover px-2 py-2.5 transition-colors hover:bg-brand-surface">
                    <span className="min-w-0 flex-1 truncate text-xs text-brand-active">{ticket.title}</span>
                    <span className="shrink-0 text-[10px] text-brand-surface_m">{ticket.customerName || `تیکت ${ticket.databaseId}`}</span>
                    {ticket.linkedOrderId ? <span className="shrink-0 text-[10px] text-brand-m_khonsa">سفارش {ticket.linkedOrderId.toLocaleString("fa-IR")}</span> : null}
                  </Link>
                ))}
                <Link href="/admin/tickets" prefetch={false} className="mt-2 inline-flex px-2 text-[11px] text-brand-blue hover:text-brand-active">مشاهدهٔ همهٔ تیکت‌ها</Link>
              </div>
            )}
          </details>
        </section>
      ) : null}

      {data.pricingHealth ? (
        <section className="border-b border-brand-surface_hover">
          <details>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 text-xs text-brand-m_khonsa marker:content-none [&::-webkit-details-marker]:hidden">
              <span>وضعیت موتور قیمت‌گذاری</span>
              <span className="flex items-center gap-2 text-brand-surface_m">
                {PRICING_STATUS[data.pricingHealth.status ?? "failed"] ?? "نامشخص"}
                <ChevronDown size={14} />
              </span>
            </summary>
            <div className="grid gap-2 pb-3 sm:grid-cols-3">
              <Metric label="نرخ‌های آماده" value={`${Math.min(4, Number(data.pricingHealth.availableRates ?? 0)).toLocaleString("fa-IR")} از ۴`} />
              <Metric label="اتصال سرویس" value={data.pricingHealth.apiConfigured ? (data.pricingHealth.apiHealthy ? "متصل" : "قطع") : "تنظیم دستی"} />
              <Metric label="حالت جایگزین" value={data.pricingHealth.fallbackActive ? "فعال" : "غیرفعال"} />
            </div>
          </details>
        </section>
      ) : null}
    </AdminPage>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brand-surface_hover bg-brand-surface px-3 py-2">
      <div className="text-[10px] text-brand-surface_m">{label}</div>
      <div className="mt-1 text-xs font-medium text-brand-active">{value}</div>
    </div>
  );
}
