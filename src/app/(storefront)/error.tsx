"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4 px-6 text-center" dir="rtl">
      <span className="text-5xl">⚠️</span>
      <h1 className="text-xl font-bold text-white">مشکلی در دریافت اطلاعات پیش آمد</h1>
      <p className="text-sm text-brand-m_khonsa max-w-sm">
        اتصال به سرور با خطا مواجه شد. لطفاً دوباره تلاش کنید یا به صفحه اصلی برگردید.
      </p>
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 bg-brand-blue hover:bg-[#0062d1] text-white text-sm font-bold px-5 py-2.5 transition-colors"
        >
          <RefreshCw size={15} />
          تلاش مجدد
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 bg-brand-surface border border-brand-surface_hover hover:bg-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-5 py-2.5 transition-colors"
        >
          <Home size={15} />
          صفحه اصلی
        </Link>
      </div>
    </div>
  );
}