"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, RefreshCw, WifiOff } from "lucide-react";

export default function SessionUnavailable() {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    router.refresh();
    window.setTimeout(() => setIsRetrying(false), 1500);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/my-account";
  };

  return (
    <div
      role="alert"
      dir="rtl"
      className="w-full max-w-md mx-auto bg-brand-surface border border-brand-surface_hover p-6 md:p-8 flex flex-col items-center gap-4 text-center"
    >
      <span className="w-12 h-12 rounded-full bg-brand-zard/10 text-brand-zard flex items-center justify-center">
        <WifiOff size={22} />
      </span>
      <h1 className="text-lg font-black text-white">ارتباط با سرور برقرار نشد</h1>
      <p className="text-xs text-brand-m_khonsa leading-6">
        مشکل موقتی در دریافت اطلاعات حساب پیش آمده. شما از حساب خارج نشده‌اید؛ چند لحظه بعد دوباره تلاش کنید.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying || isResetting}
          className="flex-1 w-full bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-sm font-bold py-2.5 flex items-center justify-center gap-2 transition-colors"
        >
          {isRetrying ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          تلاش مجدد
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isRetrying || isResetting}
          className="flex-1 w-full bg-brand-bg border border-brand-surface_hover hover:bg-brand-surface_hover disabled:opacity-60 text-brand-m_khonsa text-sm font-bold py-2.5 flex items-center justify-center gap-2 transition-colors"
        >
          {isResetting ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
          خروج و ورود دوباره
        </button>
      </div>
    </div>
  );
}