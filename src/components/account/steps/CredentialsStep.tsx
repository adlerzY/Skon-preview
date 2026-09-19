"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifyAuthStateChanged } from "@/components/Header/HeaderViewerProvider";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";

const normalizeDigits = (str: string) => {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

interface CredentialsStepProps {
  onAdminTotp: (pendingTicket: string, requiresSetup: boolean) => void;
  onForgotPassword: () => void;
}

export default function CredentialsStep({
  onAdminTotp,
  onForgotPassword,
}: CredentialsStepProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanIdentifier = normalizeDigits(identifier.trim());

    if (!cleanIdentifier) {
      setError("شماره موبایل یا ایمیل را وارد کنید");
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
        body: JSON.stringify({ identifier: cleanIdentifier, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.requiresAdminTotp || data?.requiresAdminTotpSetup) {
          onAdminTotp(data.pendingTicket, Boolean(data.requiresAdminTotpSetup));
          return;
        }
        setError(data?.error || "اطلاعات ورود اشتباه است");
        return;
      }

      if (data?.requiresAdminTotp || data?.requiresAdminTotpSetup) {
        onAdminTotp(data.pendingTicket, Boolean(data.requiresAdminTotpSetup));
        return;
      }

      notifyAuthStateChanged();
        router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور. لطفاً اینترنت خود را بررسی کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 rounded text-center"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-xs font-bold text-brand-surface_m">
          شماره موبایل یا ایمیل
        </label>
        <div className="relative">
          <User
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m pointer-events-none"
          />
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            dir="ltr"
            placeholder="09123456789 یا you@example.com"
            autoComplete="username"
            disabled={isLoading}
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active text-left focus:outline-none focus:border-brand-blue disabled:opacity-50 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-bold text-brand-surface_m">
            رمز عبور
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={isLoading}
            className="text-[11px] font-bold text-brand-blue hover:text-white transition-colors"
          >
            فراموشی رمز عبور؟
          </button>
        </div>
        <div className="relative">
          <Lock
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m pointer-events-none"
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            dir="ltr"
            disabled={isLoading}
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-10 py-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue disabled:opacity-50 transition-colors text-left"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-surface_m hover:text-brand-active transition-colors"
            aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {isLoading ? "در حال ورود..." : "ورود"}
      </button>
    </form>
  );
}