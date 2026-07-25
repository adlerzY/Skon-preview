"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Mail } from "lucide-react";

export default function CompleteProfileStep({
  phone,
  code,
  onAdminTotp,
}: {
  phone: string;
  code: string;
  onAdminTotp: (pendingTicket: string, requiresSetup: boolean) => void;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (displayName.trim().length < 2) {
      setError("نام نمایشی را کامل وارد کنید");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("ایمیل وارد شده معتبر نیست");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          displayName: displayName.trim(),
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok && !data?.requiresAdminTotp && !data?.requiresAdminTotpSetup) {
        setError(data?.error || "ثبت‌نام با خطا مواجه شد");
        return;
      }

      if (data.requiresAdminTotp || data.requiresAdminTotpSetup) {
        onAdminTotp(data.pendingTicket, Boolean(data.requiresAdminTotpSetup));
        return;
      }

      if (data.success) {
        router.refresh();
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center flex flex-col gap-1">
        <span className="text-sm font-bold text-white">تکمیل ثبت‌نام</span>
        <span className="text-xs text-brand-m_khonsa">این آخرین قدمه، فقط نامتو بگو</span>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">نام نمایشی (اجباری)</label>
        <div className="relative">
          <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="مثلاً علی رضایی"
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">ایمیل (اختیاری)</label>
        <div className="relative">
          <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            placeholder="you@example.com"
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active text-left focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? "در حال ساخت حساب..." : "ساخت حساب و ورود"}
      </button>
    </form>
  );
}