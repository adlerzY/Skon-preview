"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Gauge, RefreshCw, RotateCcw, Server, TimerReset, Wrench, Zap } from "lucide-react";
import { useAdminContext } from "./AdminContext";
import { AdminBadge, AdminCard, AdminEmpty, AdminPage, AdminPageIntro, AdminRefreshButton, AdminStatCard } from "./AdminUi";

type Health = {
  overallStatus: string; pluginVersion: string; schemaVersion: number; phpVersion: string; wordpressVersion: string; woocommerceVersion: string; graphqlVersion: string;
  actionSchedulerAvailable: boolean; actionSchedulerPending: number; actionSchedulerRunning: number; actionSchedulerFailed: number; actionSchedulerOverdue: number; nextActionAt: string | null;
  rateIntervalHours: number; rateLastSyncAt: string | null; rateNextRunAt: string | null; rateConfigured: boolean;
  schedulerStatus: string; schedulerProgress: string; schedulerPendingRequest: boolean;
  revalidationPending: number; revalidationClaimed: number; revalidationFailed: number; revalidationTableReady: boolean; revalidationScheduled: boolean;
  auditTableReady: boolean; auditEntries: number; checkedAt: string;
};
type FailedJob = { actionId: number; hook: string; status: string; scheduledAt: string; lastAttemptAt: string; attempts: number };
const statusLabel: Record<string, string> = { ok: "سالم", warning: "نیازمند توجه", error: "خطا", running: "در حال اجرا", idle: "آزاد" };
function statTone(status: string): "default" | "success" | "info" | "warning" {
  return status === "ok" || status === "success" ? "success" : status === "warning" ? "warning" : status === "error" ? "warning" : "info";
}

function badgeTone(status: string): "neutral" | "info" | "success" | "warning" | "danger" {
  return status === "ok" || status === "success" ? "success" : status === "warning" ? "warning" : status === "error" ? "danger" : status === "running" ? "info" : "neutral";
}
function fmt(value?: string | null) { return value ? new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z")).toLocaleString("fa-IR") : "—"; }

export default function AdminEngineClient({ initial }: { initial?: { health: Health | null; failedJobs: FailedJob[] } }) {
  const { permissions } = useAdminContext();
  const [health, setHealth] = useState<Health | null>(initial?.health ?? null), [failedJobs, setFailedJobs] = useState<FailedJob[]>(initial?.failedJobs ?? []), [loading, setLoading] = useState(!initial), [busy, setBusy] = useState(""), [message, setMessage] = useState(""), [error, setError] = useState("");
  const canRates = permissions.includes("engine.rates"), canScheduler = permissions.includes("engine.scheduler"), canRevalidate = permissions.includes("engine.revalidation");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch("/api/admin/engine", { cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body?.error || "خطا در دریافت اطلاعات موتور"); setHealth(body?.health ?? null); setFailedJobs(Array.isArray(body?.failedJobs) ? body.failedJobs : []); }
    catch (e) { setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات موتور"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (!initial) void refresh(); }, [initial, refresh]);

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action); setMessage(""); setError("");
    try { const response = await fetch("/api/admin/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) }); const body = await response.json(); if (!response.ok) throw new Error(body?.error || "عملیات ناموفق بود"); const payload = body?.data ?? body; setMessage(payload?.message || "عملیات با موفقیت ثبت شد."); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "عملیات ناموفق بود"); }
    finally { setBusy(""); }
  }

  const status = health?.overallStatus || "warning";
  const stats = useMemo(() => health ? [
    ["در صف زمان‌بندی", health.actionSchedulerPending, health.actionSchedulerOverdue ? `${health.actionSchedulerOverdue} عقب‌افتاده` : ""],
    ["کارهای ناموفق", health.actionSchedulerFailed, "هوک‌های BTL"],
    ["بازاعتبارسنجی", health.revalidationPending + health.revalidationClaimed, `${health.revalidationFailed} ناموفق`],
    ["ورودی‌های حسابرسی", health.auditEntries, health.auditTableReady ? "جدول آماده" : "جدول ناقص"],
  ] as const : [], [health]);

  return <AdminPage className="max-w-none">
    <AdminPageIntro eyebrow="فاز ۵ · موتور / سیستم" title="وضعیت موتور و زیرساخت" description="قیمت‌گذاری، نرخ ارز، زمان‌بندی، بازاعتبارسنجی، سلامت سیستم و کارهای ناموفق را از یک نقطه کنترل کن." action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />} />
    {(message || error) && <div className={`mb-4 rounded-[5px] border p-4 text-xs ${error ? "border-red-400/20 bg-red-500/5 text-red-200" : "border-emerald-400/20 bg-emerald-500/5 text-emerald-200"}`}>{error || message}</div>}
    {!health && loading ? <AdminEmpty title="در حال دریافت وضعیت موتور..." /> : !health ? <AdminEmpty title="وضعیت موتور در دسترس نیست." description={error || "دوباره بروزرسانی را بزن."} /> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AdminStatCard label="وضعیت کلی" value={statusLabel[status] || status} helper={`آخرین بررسی: ${fmt(health.checkedAt)}`} tone={statTone(status)} />{stats.map(([label, value, helper]) => <AdminStatCard key={label} label={label} value={value} helper={helper} tone={label === "کارهای ناموفق" && Number(value) > 0 ? "warning" : "default"} />)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminCard className="p-5"><div className="flex items-center justify-between gap-3"><div><div className="mb-1 text-[10px] font-black tracking-[0.12em] text-brand-blue">وضعیت اجرا</div><h2 className="mt-1 text-base font-black text-white">نسخه و سرویس‌ها</h2></div><Server size={19} className="text-brand-blue" /></div><div className="mt-5 grid grid-cols-2 gap-3 text-xs">{[["BTL Engine", health.pluginVersion],["Schema", health.schemaVersion],["PHP", health.phpVersion],["WordPress", health.wordpressVersion],["WooCommerce", health.woocommerceVersion || "—"],["WPGraphQL", health.graphqlVersion || "—"]].map(([k,v]) => <div key={k} className="rounded-[5px] border border-white/[.06] bg-white/[.02] p-3"><div className="text-[10px] text-brand-m_khonsa">{k}</div><div className="mt-1 font-black text-white" dir="ltr">{v}</div></div>)}</div></AdminCard>
        <AdminCard className="p-5"><div className="flex items-center justify-between gap-3"><div><div className="mb-1 text-[10px] font-black tracking-[0.12em] text-brand-blue">قیمت‌گذاری و نرخ</div><h2 className="mt-1 text-base font-black text-white">نرخ و زمان‌بندی قیمت</h2></div><Gauge size={19} className="text-emerald-300" /></div><div className="mt-4 space-y-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-brand-m_khonsa">API نوسان</span><AdminBadge tone={health.rateConfigured ? "success" : "warning"}>{health.rateConfigured ? "Configured" : "Missing"}</AdminBadge></div><div className="flex items-center justify-between gap-3"><span className="text-brand-m_khonsa">فاصله همگام‌سازی</span><strong className="text-white">{health.rateIntervalHours} ساعت</strong></div><div className="flex items-center justify-between gap-3"><span className="text-brand-m_khonsa">آخرین همگام‌سازی</span><strong className="text-white" dir="ltr">{fmt(health.rateLastSyncAt)}</strong></div><div className="flex items-center justify-between gap-3"><span className="text-brand-m_khonsa">اجرای بعدی</span><strong className="text-white" dir="ltr">{fmt(health.rateNextRunAt)}</strong></div></div>{canRates && <button type="button" onClick={() => void run("rateSync")} disabled={!!busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-black transition disabled:pointer-events-none disabled:opacity-50 bg-brand-blue text-white hover:brightness-110 mt-5"><Zap size={14} />{busy === "rateSync" ? "در حال اجرا..." : "همگام‌سازی نرخ‌ها"}</button>}</AdminCard>
        <AdminCard className="p-5"><div className="flex items-center justify-between gap-3"><div><div className="mb-1 text-[10px] font-black tracking-[0.12em] text-brand-blue">زمان‌بندی</div><h2 className="mt-1 text-base font-black text-white">بازسازی قیمت‌ها</h2></div><TimerReset size={19} className="text-amber-300" /></div><div className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><span className="text-brand-m_khonsa">وضعیت</span><AdminBadge tone={badgeTone(health.schedulerStatus)}>{statusLabel[health.schedulerStatus] || health.schedulerStatus}</AdminBadge></div><div className="flex justify-between gap-4"><span className="text-brand-m_khonsa">پیشرفت</span><strong className="text-white text-left" dir="ltr">{health.schedulerProgress}</strong></div><div className="flex justify-between"><span className="text-brand-m_khonsa">درخواست در صف</span><span className="text-white">{health.schedulerPendingRequest ? "بله" : "خیر"}</span></div></div>{canScheduler && <button type="button" onClick={() => void run("pricingRebuild", { currencies: [] })} disabled={!!busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-black transition disabled:pointer-events-none disabled:opacity-50 border border-brand-surface_hover bg-brand-surface_hover/60 text-white hover:bg-brand-surface_hover mt-5"><Wrench size={14} />{busy === "pricingRebuild" ? "در حال صف‌گذاری..." : "بازسازی کامل قیمت‌ها"}</button>}</AdminCard>
        <AdminCard className="p-5"><div className="flex items-center justify-between gap-3"><div><div className="mb-1 text-[10px] font-black tracking-[0.12em] text-brand-blue">بازاعتبارسنجی</div><h2 className="mt-1 text-base font-black text-white">پاک‌سازی کش</h2></div><RefreshCw size={19} className="text-brand-blue" /></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-[5px] border border-white/[.06] p-3"><div className="text-[10px] text-brand-m_khonsa">در صف</div><strong className="text-white">{health.revalidationPending}</strong></div><div className="rounded-[5px] border border-white/[.06] p-3"><div className="text-[10px] text-brand-m_khonsa">دریافت‌شده</div><strong className="text-white">{health.revalidationClaimed}</strong></div><div className="rounded-[5px] border border-white/[.06] p-3"><div className="text-[10px] text-brand-m_khonsa">ناموفق</div><strong className="text-white">{health.revalidationFailed}</strong></div></div><div className="mt-3 text-[10px] text-brand-m_khonsa">جدول: {health.revalidationTableReady ? "آماده" : "جایگزین"} · Action: {health.revalidationScheduled ? "زمان‌بندی‌شده" : "زمان‌بندی‌نشده"}</div>{canRevalidate && <button type="button" onClick={() => void run("revalidation")} disabled={!!busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-black transition disabled:pointer-events-none disabled:opacity-50 border border-brand-surface_hover bg-brand-surface_hover/60 text-white hover:bg-brand-surface_hover mt-5"><RefreshCw size={14} />{busy === "revalidation" ? "در حال صف‌گذاری..." : "اجرای بازاعتبارسنجی"}</button>}</AdminCard>
      </div>
      <AdminCard className="mt-4 overflow-hidden"><div className="flex items-center justify-between border-b border-white/[.06] p-5"><div><div className="mb-1 text-[10px] font-black tracking-[0.12em] text-brand-blue">کارهای ناموفق</div><h2 className="mt-1 text-base font-black text-white">کارهای ناموفق زمان‌بندی عملیات</h2></div><AlertTriangle size={19} className={failedJobs.length ? "text-amber-300" : "text-emerald-300"} /></div>{failedJobs.length === 0 ? <AdminEmpty title="کار ناموفقی برای هوک‌های BTL ثبت نشده است." /> : <div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-white/[.06] text-brand-m_khonsa"><th className="px-5 py-3">ID</th><th>هوک</th><th>تعداد تلاش</th><th>آخرین تلاش</th><th className="px-5"></th></tr></thead><tbody>{failedJobs.map(job => <tr key={job.actionId} className="border-b border-white/[.04]"><td className="px-5 py-3 font-bold text-white">#{job.actionId}</td><td className="py-3 font-mono text-[11px] text-brand-m_khonsa" dir="ltr">{job.hook}</td><td className="py-3 text-white">{job.attempts}</td><td className="py-3 text-brand-m_khonsa" dir="ltr">{fmt(job.lastAttemptAt)}</td><td className="px-5 py-3 text-left">{canScheduler && <button type="button" onClick={() => void run("retryFailedJob", { actionId: job.actionId })} disabled={!!busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-black transition disabled:pointer-events-none disabled:opacity-50 border border-brand-surface_hover bg-brand-surface_hover/60 text-white hover:bg-brand-surface_hover"><RotateCcw size={13} />تلاش دوباره</button>}</td></tr>)}</tbody></table></div>}</AdminCard>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><AdminStatCard label="زمان‌بندی عملیات" value={health.actionSchedulerAvailable ? "فعال" : "غیرفعال"} helper={`${health.actionSchedulerRunning} running · ${health.actionSchedulerOverdue} overdue`} tone={health.actionSchedulerAvailable ? "success" : "warning"} /><AdminStatCard label="جدول حسابرسی" value={health.auditTableReady ? "آماده" : "Missing"} helper={`${health.auditEntries.toLocaleString("fa-IR")} ورودی`} tone={health.auditTableReady ? "success" : "warning"} /><AdminStatCard label="اقدام بعدی BTL" value={fmt(health.nextActionAt)} helper="زمان‌بندی عملیات" tone="info" /></div>
    </>}
  </AdminPage>;
}
