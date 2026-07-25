"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react";
import Image from "next/image";

export default function AdminTotpGate({
  pendingTicket,
  requiresSetup,
}: {
  pendingTicket: string;
  requiresSetup: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(requiresSetup);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!requiresSetup) return;
    fetch("/api/auth/admin-totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingTicket }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.secret) setSetupData({ secret: data.secret, otpauthUrl: data.otpauthUrl });
        else setError(data?.error || "خطا در تنظیم تأیید دومرحله‌ای");
      })
      .finally(() => setIsLoadingSetup(false));
  }, [requiresSetup, pendingTicket]);

  const handleCopySecret = async () => {
    if (!setupData) return;
    await navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("کد ۶ رقمی اپلیکیشن Authenticator را وارد کنید");
      return;
    }

    setIsVerifying(true);
    try {
      const endpoint = requiresSetup ? "/api/auth/admin-totp/confirm" : "/api/auth/admin-totp/verify";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingTicket, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "کد وارد شده صحیح نیست");
        return;
      }

      if (requiresSetup && data.recoveryCodes?.length) {
        setRecoveryCodes(data.recoveryCodes);
        return;
      }

      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsVerifying(false);
    }
  };

  if (recoveryCodes) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <ShieldCheck size={32} className="text-brand-sabz mx-auto" />
        <span className="text-sm font-bold text-white">تأیید دومرحله‌ای فعال شد</span>
        <p className="text-xs text-brand-m_khonsa leading-relaxed">
          این کدهای بازیابی رو یه جای امن ذخیره کن. هرکدوم فقط یک‌بار قابل استفاده‌ست، برای وقتی که به گوشیت دسترسی نداری.
        </p>
        <div dir="ltr" className="grid grid-cols-2 gap-2 bg-brand-bg border border-brand-surface_hover p-4 font-mono text-sm text-brand-active">
          {recoveryCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="bg-brand-blue hover:bg-[#0062d1] text-white font-bold py-3 transition-colors"
        >
          ذخیره کردم، برو به داشبورد
        </button>
      </div>
    );
  }

  if (isLoadingSetup) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-brand-m_khonsa text-sm">
        <Loader2 size={20} className="animate-spin" />
        در حال آماده‌سازی تأیید دومرحله‌ای...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center flex flex-col gap-1">
        <ShieldCheck size={24} className="text-brand-blue mx-auto mb-1" />
        <span className="text-sm font-bold text-white">
          {requiresSetup ? "تنظیم تأیید دومرحله‌ای (اجباری)" : "تأیید دومرحله‌ای"}
        </span>
        <span className="text-xs text-brand-m_khonsa">
          {requiresSetup
            ? "این حساب دسترسی ادمین داره، برای ورود باید Google Authenticator رو وصل کنی."
            : "کد ۶ رقمی اپلیکیشن Authenticator رو وارد کن."}
        </span>
      </div>

      {requiresSetup && setupData && (
        <div className="flex flex-col items-center gap-3 bg-brand-bg border border-brand-surface_hover p-4">
          <div className="bg-white p-2">
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpauthUrl)}`}
              alt="QR کد تأیید دومرحله‌ای"
              width={160}
              height={160}
            />
          </div>
          <button
            type="button"
            onClick={handleCopySecret}
            className="flex items-center gap-1.5 text-[11px] font-mono text-brand-m_khonsa hover:text-white transition-colors"
            dir="ltr"
          >
            {copied ? <Check size={12} className="text-brand-sabz" /> : <Copy size={12} />}
            {setupData.secret}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
          {error}
        </p>
      )}

      <input
        type="text"
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
        maxLength={6}
        dir="ltr"
        placeholder="۶ رقمی"
        className="w-full bg-brand-bg border border-brand-surface_hover text-center tracking-[0.4em] py-3 text-xl text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
      />

      <button
        type="submit"
        disabled={isVerifying}
        className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isVerifying && <Loader2 size={16} className="animate-spin" />}
        {isVerifying ? "در حال بررسی..." : "تأیید"}
      </button>
    </form>
  );
}