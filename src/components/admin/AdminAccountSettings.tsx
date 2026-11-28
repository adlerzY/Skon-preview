"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import AvatarPicker from "@/components/account/AvatarPicker";
import ProfileEditForm from "@/components/account/ProfileEditForm";
import SetPasswordForm from "@/components/account/SetPasswordForm";
import SessionsList from "@/components/account/SessionsList";
import {
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminField,
  AdminPage,
  AdminPageIntro,
  AdminSectionHeader,
  AdminTextarea,
} from "./AdminUi";
import { AdminErrorBanner } from "./AdminListParts";

interface SettingsData {
  user: { avatarId: string | null; avatarUrl: string | null; name: string; email: string; isStaff: boolean; hasManualPassword: boolean };
  sessions: Array<{ sessionId: string; deviceLabel?: string; ipAddress?: string; lastActive?: string; createdAt?: string }>;
  currentSessionId: string | null;
}

interface SwitchConfig {
  endpoint: string;
  textKey: "message" | "description";
  defaultTitle: string;
  defaultText: string;
  loadError: string;
  saveError: string;
  requireWhen: "enabled" | "always";
}

const NOTICE_CONFIG: SwitchConfig = {
  endpoint: "/api/admin/site-notice",
  textKey: "message",
  defaultTitle: "اطلاعیه سایت",
  defaultText: "اطلاعیه جدیدی برای شما داریم.",
  loadError: "خطا در دریافت اعلان سایت",
  saveError: "ذخیره اعلان سایت انجام نشد",
  requireWhen: "enabled",
};

const MAINTENANCE_CONFIG: SwitchConfig = {
  endpoint: "/api/admin/maintenance",
  textKey: "description",
  defaultTitle: "سایت در حال به‌روزرسانی است",
  defaultText: "در حال اعمال تغییرات و بهبودهای سایت هستیم. لطفاً چند دقیقه بعد دوباره مراجعه کنید.",
  loadError: "خطا در دریافت وضعیت تعمیرات",
  saveError: "ذخیره تنظیمات تعمیرات انجام نشد",
  requireWhen: "always",
};

function useSiteSwitch(config: SwitchConfig) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [title, setTitleValue] = useState("");
  const [text, setTextValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(config.endpoint, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error || config.loadError);
        if (!active) return;
        setEnabled(Boolean(body.enabled));
        setTitleValue(body.title || config.defaultTitle);
        setTextValue(body[config.textKey] || config.defaultText);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : config.loadError);
      });
    return () => {
      active = false;
    };
  }, [config]);

  const save = async (next: boolean | null) => {
    if (next === null || busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next, title, [config.textKey]: text }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || config.saveError);
      setEnabled(Boolean(body.enabled));
      setTitleValue(body.title || title);
      setTextValue(body[config.textKey] || text);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : config.saveError);
    } finally {
      setBusy(false);
    }
  };

  const fieldsMissing = !title.trim() || !text.trim();
  const blocked = config.requireWhen === "always" ? fieldsMissing : enabled === true && fieldsMissing;

  return {
    enabled,
    title,
    text,
    busy,
    error,
    saved,
    canSave: enabled !== null && !busy && !blocked,
    setTitle: (value: string) => {
      setTitleValue(value);
      setSaved(false);
    },
    setText: (value: string) => {
      setTextValue(value);
      setSaved(false);
    },
    toggle: () => void save(!enabled),
    saveCurrent: () => void save(enabled),
  };
}

type SiteSwitchState = ReturnType<typeof useSiteSwitch>;

function Switch({ on, disabled, busy, onClick, label }: { on: boolean; disabled: boolean; busy: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      aria-label={label}
      className={`relative h-7 w-12 shrink-0 rounded-[5px] border transition-colors disabled:opacity-50 ${on ? "border-brand-blue bg-brand-blue" : "border-brand-surface_hover bg-brand-bg"}`}
    >
      <span className={`absolute right-1 top-1 h-5 w-5 rounded-[3px] bg-brand-white transition-transform ${on ? "-translate-x-5" : "translate-x-0"}`} />
      {busy ? <Loader2 size={13} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-brand-bg" /> : null}
    </button>
  );
}

function SiteSwitchRow({
  title,
  description,
  state,
  titleLabel,
  textLabel,
  titleMax,
  textMax,
  onText,
  offText,
  saveLabel,
}: {
  title: string;
  description: string;
  state: SiteSwitchState;
  titleLabel: string;
  textLabel: string;
  titleMax: number;
  textMax: number;
  onText: string;
  offText: string;
  saveLabel: string;
}): ReactNode {
  const on = state.enabled === true;
  return (
    <div className="border-b border-brand-surface_hover last:border-b-0">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-brand-active">{title}</div>
          <div className="mt-0.5 text-[12px] leading-5 text-brand-m_khonsa">{description}</div>
          <div className={`mt-1 text-[12px] ${on ? "text-brand-zard" : "text-brand-sabz"}`}>
            {state.enabled === null ? "در حال دریافت وضعیت…" : on ? onText : offText}
            {state.saved ? " · ذخیره شد" : ""}
          </div>
        </div>
        <Switch on={on} disabled={state.enabled === null || state.busy} busy={state.busy} onClick={state.toggle} label={title} />
      </div>

      {state.error ? <div className="px-4 pb-3 text-[13px] text-brand-zard">{state.error}</div> : null}

      <details className="border-t border-brand-surface_hover">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 py-2 text-[13px] text-brand-blue hover:text-brand-active marker:content-none [&::-webkit-details-marker]:hidden">
          ویرایش متن
        </summary>
        <div className="grid gap-3 px-4 pb-4">
          <label className="grid gap-1.5 text-[13px] text-brand-m_khonsa">
            {titleLabel}
            <AdminField value={state.title} onChange={(event) => state.setTitle(event.target.value)} disabled={state.enabled === null || state.busy} maxLength={titleMax} />
          </label>
          <label className="grid gap-1.5 text-[13px] text-brand-m_khonsa">
            {textLabel}
            <AdminTextarea value={state.text} onChange={(event) => state.setText(event.target.value)} disabled={state.enabled === null || state.busy} maxLength={textMax} />
          </label>
          <AdminButton variant="primary" onClick={state.saveCurrent} disabled={!state.canSave} className="sm:w-fit">
            {state.busy ? <Loader2 size={15} className="animate-spin" /> : null}
            {state.busy ? "در حال ذخیره..." : saveLabel}
          </AdminButton>
        </div>
      </details>
    </div>
  );
}

export default function AdminAccountSettings({ initial }: { initial?: SettingsData }) {
  const [data, setData] = useState<SettingsData | null>(initial ?? null);
  const [error, setError] = useState("");
  const notice = useSiteSwitch(NOTICE_CONFIG);
  const maintenance = useSiteSwitch(MAINTENANCE_CONFIG);

  useEffect(() => {
    if (initial) return;
    fetch("/api/admin/account-settings", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error || "خطا در دریافت تنظیمات حساب");
        setData(body);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "خطا در دریافت تنظیمات حساب"));
  }, [initial]);

  return (
    <AdminPage>
      <AdminPageIntro title="تنظیمات حساب" description="اطلاعات حساب، امنیت و وضعیت سایت را بدون خروج از پنل مدیریت کن." />

      <AdminErrorBanner message={error} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <AdminCard className="overflow-hidden">
          <AdminSectionHeader title="اطلاعات پروفایل" description="نام و تصویر حساب مدیریت" />
          <div className="p-4">
            {!data ? (
              <AdminEmpty title="اطلاعات حساب در حال بارگذاری است." />
            ) : (
              <>
                <AvatarPicker currentAvatarId={data.user.avatarId} currentAvatarUrl={data.user.avatarUrl} name={data.user.name} isStaff={data.user.isStaff} />
                <div className="mt-5 border-t border-brand-surface_hover pt-5">
                  <ProfileEditForm name={data.user.name} email={data.user.email} />
                </div>
              </>
            )}
          </div>
        </AdminCard>

        <AdminCard className="h-fit overflow-hidden">
          <AdminSectionHeader title="امنیت" description="رمز عبور و دسترسی حساب" />
          <div className="p-4">
            {!data ? <AdminEmpty title="امنیت حساب در حال بارگذاری است." /> : <SetPasswordForm hasManualPassword={data.user.hasManualPassword} />}
          </div>
        </AdminCard>
      </div>

      <AdminCard className="mt-4 overflow-hidden">
        <AdminSectionHeader title="وضعیت سایت" description="تغییرات فوراً برای کاربران فروشگاه اعمال می‌شود." />
        <SiteSwitchRow
          title="اعلان سایت"
          description="یک پیام کوتاه عمومی در هدر سایت برای اطلاع‌رسانی به کاربران نمایش می‌دهد."
          state={notice}
          titleLabel="عنوان اعلان"
          textLabel="متن اعلان"
          titleMax={100}
          textMax={300}
          onText="اعلان در هدر سایت نمایش داده می‌شود."
          offText="هیچ اعلان عمومی در هدر نمایش داده نمی‌شود."
          saveLabel="ذخیره اعلان"
        />
        <SiteSwitchRow
          title="حالت تعمیرات"
          description="موقتاً همه صفحات فروشگاه را برای کاربران عادی می‌بندد؛ ادمین همچنان دسترسی دارد."
          state={maintenance}
          titleLabel="عنوان صفحه تعمیرات"
          textLabel="توضیح صفحه تعمیرات"
          titleMax={120}
          textMax={600}
          onText="کاربران عادی صفحه تعمیرات را می‌بینند."
          offText="سایت در حالت عادی قابل مشاهده است."
          saveLabel="ذخیره متن و تنظیمات"
        />
      </AdminCard>

      <AdminCard className="mt-4 overflow-hidden">
        <details>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-semibold text-brand-active marker:content-none [&::-webkit-details-marker]:hidden">
            <span>نشست‌های فعال</span>
            <span className="text-[13px] font-normal text-brand-surface_m">
              {data ? data.sessions.length.toLocaleString("fa-IR") : "—"}
            </span>
          </summary>
          <div className="border-t border-brand-surface_hover p-4">
            {!data ? <AdminEmpty title="نشست‌ها در حال بارگذاری است." /> : <SessionsList sessions={data.sessions} currentSessionId={data.currentSessionId} />}
          </div>
        </details>
      </AdminCard>
    </AdminPage>
  );
}