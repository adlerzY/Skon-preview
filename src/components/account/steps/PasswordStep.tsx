"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock } from "lucide-react";

export default function PasswordStep({
  onBack,
  onAdminTotp,
}: {
  onBack: () => void;
  onAdminTotp: (pendingTicket: string, requiresSetup: boolean) => void;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^09\d{9}$/.test(phone.trim())) {
      setError("شماره موبایل را به‌درستی وارد کنید");
      return;
    }
    if (!password) {
      setError("رمز عبور را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/phone/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok && !data?.requiresAdminTotp && !data?.requiresAdminTotpSetup) {
        setError(data?.error || "ورود ناموفق بود");
        return;
      }

      if (data.requiresAdminTotp || data.requiresAdminTotpSetup) {
        onAdminTotp(data.pendingTicket, Boolean(data.requiresAdminTotpSetup));
        return;
      }

      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-xs text-brand-m_khonsa hover:text-white transition-colors"
      >
        ورود با کد تأیید
      </button>

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">شماره موبایل</label>
        <div className="relative">
          <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            dir="ltr"
            placeholder="09123456789"
            maxLength={11}
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active text-left focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">رمز عبور</label>
        <div className="relative">
          <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {isLoading ? "در حال ورود..." : "ورود"}
      </button>
    </form>
  );
}