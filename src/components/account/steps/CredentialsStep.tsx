"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Lock } from "lucide-react";

export default function CredentialsStep({
  onAdminTotp,
  onForgotPassword,
}: {
  onAdminTotp: (pendingTicket: string, requiresSetup: boolean) => void;
  onForgotPassword: () => void;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError("شماره موبایل یا ایمیل را وارد کنید");
      return;
    }
    if (!password) {
      setError("رمز عبور را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmedIdentifier, password }),
      });
      const data = await res.json();

      if (!res.ok && !data?.requiresAdminTotp && !data?.requiresAdminTotpSetup) {
        setError(data?.error || "اطلاعات ورود اشتباه است");
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
      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">شماره موبایل یا ایمیل</label>
        <div className="relative">
          <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            dir="ltr"
            placeholder="09123456789 یا you@example.com"
            autoComplete="username"
            className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active text-left focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-brand-surface_m">رمز عبور</label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[11px] font-bold text-brand-blue hover:text-white transition-colors"
          >
            فراموشی رمز عبور؟
          </button>
        </div>
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
        className="mt-1 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {isLoading ? "در حال ورود..." : "ورود"}
      </button>
    </form>
  );
}