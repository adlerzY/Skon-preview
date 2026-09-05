"use client";

import { useState } from "react";
import { Loader2, KeyRound, Check } from "lucide-react";

export default function SetPasswordForm({ hasManualPassword }: { hasManualPassword: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [manualFlag, setManualFlag] = useState(hasManualPassword);

  const resetFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("رمز عبور جدید باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }
    if (manualFlag && !currentPassword) {
      setError("رمز عبور فعلی را وارد کنید");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: manualFlag ? currentPassword : undefined, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "بروزرسانی رمز عبور با خطا مواجه شد");
        return;
      }

      setSuccess(manualFlag ? "رمز عبور با موفقیت تغییر کرد" : "رمز عبور با موفقیت تنظیم شد");
      setManualFlag(true);
      resetFields();
      setIsEditing(false);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    resetFields();
    setError("");
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-brand-surface_m">رمز عبور حساب</span>
          <span className="text-[11px] text-brand-m_khonsa">
            {manualFlag ? "برای ورود سریع‌تر می‌توانید از رمز عبور استفاده کنید" : "هنوز رمز عبوری برای حساب خود تنظیم نکرده‌اید"}
          </span>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white transition-colors"
          >
            <KeyRound size={13} />
            {manualFlag ? "تغییر رمز عبور" : "تنظیم رمز عبور"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">{error}</p>}
      {success && !isEditing && (
        <p className="text-xs text-brand-sabz font-medium bg-brand-sabz/10 border border-brand-sabz/20 p-3 flex items-center gap-1.5">
          <Check size={13} />
          {success}
        </p>
      )}

      {isEditing && (
        <div className="flex flex-col gap-3">
          {manualFlag && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand-m_khonsa">رمز عبور فعلی</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-brand-m_khonsa">رمز عبور جدید</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-brand-m_khonsa">تکرار رمز عبور جدید</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-sm font-bold py-2.5 flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isSaving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 bg-brand-bg border border-brand-surface_hover hover:bg-brand-surface_hover text-brand-m_khonsa text-sm font-bold py-2.5 transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      )}
    </div>
  );
}