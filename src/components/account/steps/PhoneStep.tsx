"use client";

import { useState, useCallback } from "react";
import { Loader2, Phone } from "lucide-react";
import TurnstileWidget from "../TurnstileWidget";

export default function PhoneStep({
  onOtpSent,
}: {
  onOtpSent: (phone: string, cooldownSeconds: number) => void;
}) {
  const [phone, setPhone] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = phone.trim();
    if (!/^09\d{9}$/.test(trimmed)) {
      setError("شماره موبایل را به‌درستی وارد کنید (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    if (!turnstileToken) {
      setError("لطفاً چند لحظه صبر کنید تا تأیید امنیتی کامل شود");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/phone/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed, turnstileToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "ارسال کد با خطا مواجه شد");
        return;
      }

      onOtpSent(trimmed, data.cooldownSeconds ?? 60);
    } catch {
      setError("خطا در ارتباط با سرور. اتصال اینترنت خود را بررسی کنید");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            autoComplete="tel"
            dir="ltr"
            placeholder="09123456789"
            maxLength={11}
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active text-left focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
      </div>

      <TurnstileWidget onVerify={handleTurnstileVerify} />

      <button
        type="submit"
        disabled={isLoading}
        className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {isLoading ? "در حال ارسال کد..." : "دریافت کد تأیید"}
      </button>
    </form>
  );
}