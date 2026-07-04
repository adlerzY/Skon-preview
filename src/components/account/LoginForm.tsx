"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("لطفاً نام کاربری و رمز عبور را وارد کنید");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "ورود ناموفق بود");
        return;
      }

      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور. اتصال اینترنت خود را بررسی کنید");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-surface_hover p-6 md:p-8 flex flex-col gap-6 max-w-md mx-auto">
      <div className="text-center flex flex-col gap-1">
        <h1 className="text-xl font-black text-white">ورود به حساب کاربری</h1>
        <p className="text-xs text-brand-m_khonsa">
          برای ثبت نظر و تکمیل خرید باید وارد حساب خود شوید
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="مثلاً user@example.com"
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
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {isLoading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}