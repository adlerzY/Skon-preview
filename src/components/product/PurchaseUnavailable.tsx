"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";

export default function PurchaseUnavailable() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 text-center bg-brand-surface border border-brand-surface_hover p-6"
    >
      <span className="w-12 h-12 rounded-full bg-brand-zard/10 text-brand-zard flex items-center justify-center">
        <WifiOff size={22} />
      </span>
      <p className="text-sm font-bold text-brand-active">دریافت قیمت و موجودی موقتاً با مشکل مواجه شد</p>
      <p className="text-xs text-brand-m_khonsa leading-6">
        این به معنی ناموجود بودن محصول نیست؛ چند لحظه بعد دوباره تلاش کنید.
      </p>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
        className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 flex items-center gap-2 transition-colors"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        تلاش مجدد
      </button>
    </div>
  );
}