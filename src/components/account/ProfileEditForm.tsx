"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";

interface ProfileEditFormProps {
  name: string;
  email: string;
}

export default function ProfileEditForm({ name, email }: ProfileEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [emailValue, setEmailValue] = useState(email);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const [firstName, ...rest] = nameValue.trim().split(" ");
    const lastName = rest.join(" ");

    if (!firstName) {
      setError("نام نمی‌تواند خالی باشد");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email: emailValue.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "خطا در بروزرسانی اطلاعات");
        return;
      }

      setSuccess("اطلاعات با موفقیت بروزرسانی شد");
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNameValue(name);
    setEmailValue(email);
    setIsEditing(false);
    setError("");
  };

  return (
    <div className="bg-brand-surface border border-brand-surface_hover p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-surface_m">اطلاعات حساب</span>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white transition-colors"
          >
            <Pencil size={13} /> ویرایش
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">{error}</p>}
      {success && !isEditing && (
        <p className="text-xs text-brand-sabz font-medium bg-brand-sabz/10 border border-brand-sabz/20 p-3">{success}</p>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-brand-m_khonsa">نام و نام خانوادگی</label>
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-brand-m_khonsa">ایمیل</label>
            <input
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              dir="ltr"
              className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
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
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between border-b border-brand-surface_hover pb-2">
            <span className="text-brand-m_khonsa">نام</span>
            <span className="text-white font-medium">{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-m_khonsa">ایمیل</span>
            <span className="text-white font-medium" dir="ltr">{email}</span>
          </div>
        </div>
      )}
    </div>
  );
}