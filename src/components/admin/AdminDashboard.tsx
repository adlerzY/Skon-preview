"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminFieldRow,
  AdminPage,
  AdminPageIntro,
  AdminRefreshButton,
  AdminSectionHeader,
} from "./AdminUi";
import { AdminErrorBanner } from "./AdminListParts";
import { faDate, faDateTime, faNumber } from "./format";

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

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const PRICING_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  healthy: { label: "سالم", tone: "success" },
  partial: { label: "نیمه‌فعال", tone: "warning" },
  fallback: { label: "حالت جایگزین فعال", tone: "warning" },
  manual: { label: "تنظیم دستی", tone: "neutral" },
  failed: { label: "ناموفق", tone: "danger" },
};

const API_STATUS_LABELS: Record<string, string> = {
  not_tested: "هنوز بررسی نشده",
  healthy: "سالم",
  success: "موفق",
  partial_success: "موفقیت ناقص",
  deviation_rejected: "رد شده توسط محافظ نوسان",
  missing_credentials: "کلید سرویس تنظیم نشده",
  connection_failed: "خطای اتصال",
  transport_error: "خطای ارتباطی",
  invalid_json: "پاسخ نامعتبر",
  invalid_response: "پاسخ نامعتبر",
};

const MAX_VISIBLE_TICKETS = 5;

function QueueTile({ href, label, value }: { href: string; label: string; value: number }) {
  const attention = value > 0;
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex min-h-[72px] items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-brand-surface_hover/40 sm:flex-1"
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] text-brand-m_khonsa">{label}</span>
        <span className={`text-[20px] font-semibold leading-7 tabular-nums ${attention ? "text-brand-zard" : "text-brand-active"}`}>
          {faNumber(value)}
        </span>
      </span>
      <ChevronLeft size={18} className="shrink-0 text-brand-surface_m" />
    </Link>
  );
}

function apiStatusText(value?: string): string {
  const key = String(value ?? "").trim();
  if (!key) return "—";
  return API_STATUS_LABELS[key] ?? key;
}

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

  const queue = [
    hasOrders ? { href: "/admin/orders", label: "سفارش‌های در حال پردازش", value: data.summary.processingOrdersCount } : null,
    hasTickets ? { href: "/admin/tickets", label: "تیکت‌های باز", value: data.summary.openTicketsCount } : null,
    hasReviews ? { href: "/admin/reviews", label: "دیدگاه‌های در انتظار بررسی", value: data.summary.pendingReviewsCount } : null,
  ].filter((item): item is { href: string; label: string; value: number } => item !== null);

  const pendingTotal = queue.reduce((sum, item) => sum + item.value, 0);
  const pricing = data.pricingHealth;
  const pricingStatus = PRICING_STATUS[pricing?.status ?? "failed"] ?? { label: "نامشخص", tone: "neutral" as BadgeTone };
  const visibleTickets = data.tickets.slice(0, MAX_VISIBLE_TICKETS);
  const hasSecondRow = hasTickets || Boolean(pricing);

  return (
    <AdminPage>
      <AdminPageIntro
        title="پیشخوان"
        description={`خوش آمدی ${user?.name || "مدیر"}`}
        action={<AdminRefreshButton onClick={() => void refreshDashboard()} loading={refreshing} />}
      />

      {refreshError ? (
        <AdminErrorBanner
          message="بروزرسانی انجام نشد؛ اطلاعات قبلی نمایش داده می‌شود."
          onRetry={() => void refreshDashboard()}
        />
      ) : null}

      <div className={`space-y-4 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        {queue.length > 0 ? (
          <AdminCard className="overflow-hidden">
            <div className="flex flex-col divide-y divide-brand-surface_hover sm:flex-row sm:divide-x sm:divide-y-0 sm:divide-x-reverse">
              {queue.map((item) => (
                <QueueTile key={item.href} href={item.href} label={item.label} value={item.value} />
              ))}
            </div>
            {pendingTotal === 0 ? (
              <div className="border-t border-brand-surface_hover px-4 py-2.5 text-[13px] text-brand-sabz">
                کار معوقی وجود ندارد.
              </div>
            ) : null}
          </AdminCard>
        ) : null}

        {hasSecondRow ? (
          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            {hasTickets ? (
              <AdminCard className="overflow-hidden">
                <AdminSectionHeader
                  title="تیکت‌های اخیر"
                  description="قدیمی‌ترین تیکت‌های بازِ منتظر پاسخ"
                  action={
                    <Link href="/admin/tickets" prefetch={false} className="text-[13px] text-brand-blue transition-colors hover:text-brand-active">
                      همهٔ تیکت‌ها
                    </Link>
                  }
                />
                {visibleTickets.length === 0 ? (
                  <AdminEmpty title="تیکت بازی برای نمایش وجود ندارد." />
                ) : (
                  <div>
                    {visibleTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/admin/tickets/${ticket.databaseId}`}
                        prefetch={false}
                        className="flex items-center justify-between gap-3 border-b border-brand-surface_hover px-4 py-3 transition-colors last:border-b-0 hover:bg-brand-surface_hover/40"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] text-brand-active">{ticket.title}</span>
                          <span className="mt-0.5 block truncate text-[12px] text-brand-m_khonsa">
                            {ticket.customerName || `تیکت ${faNumber(ticket.databaseId)}`}
                            {ticket.linkedOrderId ? ` · سفارش ${faNumber(ticket.linkedOrderId)}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-[12px] text-brand-surface_m">{faDate(ticket.date)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </AdminCard>
            ) : null}

            {pricing ? (
              <AdminCard className="h-fit overflow-hidden">
                <AdminSectionHeader
                  title="موتور قیمت‌گذاری"
                  action={<AdminBadge tone={pricingStatus.tone}>{pricingStatus.label}</AdminBadge>}
                />
                <details className="group">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] text-brand-m_khonsa transition-colors hover:text-brand-active marker:content-none [&::-webkit-details-marker]:hidden">
                    <span>نرخ‌های آماده: {faNumber(Math.min(4, Number(pricing.availableRates ?? 0)))} از ۴</span>
                    <span className="flex items-center gap-1.5 text-brand-surface_m">
                      جزئیات
                      <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="border-t border-brand-surface_hover px-4 py-1">
                    <AdminFieldRow
                      label="اتصال سرویس"
                      value={pricing.apiConfigured ? (pricing.apiHealthy ? "متصل" : "قطع") : "تنظیم دستی"}
                      ltr={false}
                    />
                    <AdminFieldRow label="حالت جایگزین" value={pricing.fallbackActive ? "فعال" : "غیرفعال"} ltr={false} />
                    <AdminFieldRow label="نتیجهٔ آخرین بررسی" value={apiStatusText(pricing.apiStatus)} ltr={false} />
                    <AdminFieldRow
                      label="زمان آخرین بررسی"
                      value={pricing.checkedAt ? faDateTime(new Date(Number(pricing.checkedAt) * 1000).toISOString()) : "—"}
                      ltr={false}
                    />
                  </div>
                </details>
              </AdminCard>
            ) : null}
          </div>
        ) : null}

        {queue.length === 0 && !hasSecondRow ? <AdminEmpty title="برای نمایش اطلاعات پیشخوان مجوز لازم را ندارید." /> : null}
      </div>
    </AdminPage>
  );
}