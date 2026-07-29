// src/components/account/AdminLoginFlow.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, User, Lock, ChevronRight } from "lucide-react";
import AdminTotpGate from "./steps/AdminTotpGate";

type Step = { name: "credentials" } | { name: "admin-totp"; pendingTicket: string; requiresSetup: boolean };

export default function AdminLoginFlow() {
  const [step, setStep] = useState<Step>({ name: "credentials" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("نام کاربری و رمز عبور را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "ورود ناموفق بود");
        return;
      }

      setStep({ name: "admin-totp", pendingTicket: data.pendingTicket, requiresSetup: Boolean(data.requiresAdminTotpSetup) });
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-brand-surface border border-brand-surface_hover p-6 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 pb-5 border-b border-brand-surface_hover">
        <Link href="/" aria-label="صفحه اصلی">
          <Image
            src="/images/arena2battleLogo.webp"
            alt="Arena2Battle"
            width={130}
            height={44}
            style={{ width: "auto" }}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <Link href="/" className="flex items-center gap-1 text-xs text-brand-m_khonsa hover:text-white transition-colors">
          <ChevronRight size={14} />
          بازگشت به فروشگاه
        </Link>
      </div>

      {step.name === "credentials" && (
        <>
          <div className="text-center flex flex-col gap-1">
            <h1 className="text-xl font-black text-white">ورود مدیریت</h1>
            <p className="text-xs text-brand-m_khonsa leading-relaxed">مخصوص حساب‌های ادمین بدون شماره موبایل ثبت‌شده</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-surface_m">نام کاربری یا ایمیل</label>
              <div className="relative">
                <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
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
        </>
      )}

      {step.name === "admin-totp" && (
        <AdminTotpGate pendingTicket={step.pendingTicket} requiresSetup={step.requiresSetup} />
      )}
    </div>
  );
}