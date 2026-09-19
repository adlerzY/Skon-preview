"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { notifyAuthStateChanged } from "@/components/Header/HeaderViewerProvider";
import { Loader2, ShieldCheck, Copy, Check, MessageSquareText, KeyRound } from "lucide-react";
import dynamic from "next/dynamic";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  {
    ssr: false,
    loading: () => <div className="w-[160px] h-[160px] bg-white/10 animate-pulse" />,
  }
);

type AuthMethod = "totp" | "sms";

const toEnglishDigits = (value: string): string => {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[^\d]/g, "");
};

export default function AdminTotpGate({
  pendingTicket,
  requiresSetup,
}: {
  pendingTicket: string;
  requiresSetup: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [method, setMethod] = useState<AuthMethod>("totp");

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(requiresSetup);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const [smsPhone, setSmsPhone] = useState("");
  const [smsRequiresPhoneInput, setSmsRequiresPhoneInput] = useState(false);
  const [smsMaskedPhone, setSmsMaskedPhone] = useState<string | null>(null);
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifyingSms, setIsVerifyingSms] = useState(false);
  const [smsError, setSmsError] = useState("");

  const goToAccount = useCallback(() => {
    notifyAuthStateChanged();
    if (pathname === "/admin") {
      router.refresh();
    } else {
      router.push("/admin");
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!requiresSetup) return;

    const controller = new AbortController();
    fetch("/api/auth/admin-totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingTicket }),
      signal: controller.signal,
    })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (data?.secret) {
          setSetupData({ secret: data.secret, otpauthUrl: data.otpauthUrl });
        } else {
          setError(data?.error || "خطا در تنظیم تأیید دومرحله‌ای");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError("خطا در ارتباط با سرور");
        }
      })
      .finally(() => setIsLoadingSetup(false));

    return () => controller.abort();
  }, [requiresSetup, pendingTicket]);

  useEffect(() => {
    if (smsCooldown <= 0) return;
    const timer = setInterval(() => setSmsCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [smsCooldown]);

  const handleCopySecret = async () => {
    if (!setupData) return;
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("امکان کپی خودکار وجود ندارد، لطفاً دستی کپی کنید.");
    }
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
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "کد وارد شده صحیح نیست");
        return;
      }

      if (requiresSetup && data?.recoveryCodes?.length) {
        setRecoveryCodes(data.recoveryCodes);
        return;
      }

      goToAccount();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsVerifying(false);
    }
  };

  const requestSmsCode = useCallback(
    async (phoneOverride?: string) => {
      setSmsError("");
      setIsSendingSms(true);
      try {
        const res = await fetch("/api/auth/admin-sms/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingTicket, phone: phoneOverride }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setSmsError(data?.error || "ارسال کد با خطا مواجه شد");
          return;
        }

        if (data?.requiresPhoneInput) {
          setSmsRequiresPhoneInput(true);
          setSmsCodeSent(false);
          return;
        }

        setSmsRequiresPhoneInput(false);
        setSmsMaskedPhone(data?.maskedPhone ?? null);
        setSmsCodeSent(true);
        setSmsCooldown(data?.cooldownSeconds ?? 60);
      } catch {
        setSmsError("خطا در ارتباط با سرور");
      } finally {
        setIsSendingSms(false);
      }
    },
    [pendingTicket]
  );

  useEffect(() => {
    if (method === "sms" && !smsCodeSent && !smsRequiresPhoneInput) {
      requestSmsCode();
    }
  }, [method, smsCodeSent, smsRequiresPhoneInput, requestSmsCode]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = toEnglishDigits(smsPhone.trim());
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setSmsError("شماره موبایل را به‌درستی وارد کنید (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    await requestSmsCode(cleanPhone);
  };

  const handleSmsVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsError("");

    const cleanCode = toEnglishDigits(smsCode.trim());
    if (cleanCode.length < 5) {
      setSmsError("کد تأیید را کامل وارد کنید");
      return;
    }

    setIsVerifyingSms(true);
    try {
      const res = await fetch("/api/auth/admin-sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingTicket, code: cleanCode }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSmsError(data?.error || "کد وارد شده صحیح نیست");
        return;
      }

      goToAccount();
    } catch {
      setSmsError("خطا در ارتباط با سرور");
    } finally {
      setIsVerifyingSms(false);
    }
  };

  const switchToSms = () => {
    setMethod("sms");
    setError("");
  };

  const switchToTotp = () => {
    setMethod("totp");
    setSmsError("");
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
          onClick={goToAccount}
          className="bg-brand-blue hover:bg-[#0062d1] text-white font-bold py-3 transition-colors"
        >
          ذخیره کردم، برو به داشبورد
        </button>
      </div>
    );
  }

  if (method === "sms") {
    const isSmsCodeReady = toEnglishDigits(smsCode).length >= 5;

    return (
      <div className="flex flex-col gap-4">
        <div className="text-center flex flex-col gap-1">
          <MessageSquareText size={24} className="text-brand-blue mx-auto mb-1" />
          <span className="text-sm font-bold text-white">ورود با کد پیامکی</span>
          <span className="text-xs text-brand-m_khonsa">
            {smsMaskedPhone
              ? `کد تأیید به شماره ${smsMaskedPhone} پیامک شد.`
              : "کد تأیید به شماره موبایل ثبت‌شده حساب شما پیامک می‌شود."}
          </span>
        </div>

        {smsError && (
          <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
            {smsError}
          </p>
        )}

        {smsRequiresPhoneInput ? (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-surface_m">شماره موبایل برای ورود پیامکی</label>
              <input
                type="tel"
                inputMode="numeric"
                value={smsPhone}
                onChange={(e) => setSmsPhone(toEnglishDigits(e.target.value))}
                dir="ltr"
                placeholder="09123456789"
                maxLength={11}
                disabled={isSendingSms}
                className="w-full bg-brand-bg border border-brand-surface_hover pr-10 pl-3 py-3 text-sm text-brand-active text-left focus:outline-none focus:border-brand-blue disabled:opacity-50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSendingSms}
              className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
            >
              {isSendingSms && <Loader2 size={16} className="animate-spin" />}
              {isSendingSms ? "در حال ارسال..." : "ارسال کد تأیید"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSmsVerify} className="flex flex-col gap-4" noValidate>
            <input
              type="text"
              inputMode="numeric"
              value={smsCode}
              onChange={(e) => setSmsCode(toEnglishDigits(e.target.value))}
              maxLength={6}
              dir="ltr"
              placeholder="⋅ ⋅ ⋅ ⋅ ⋅"
              disabled={isVerifyingSms}
              className="w-full bg-brand-bg border border-brand-surface_hover text-center tracking-[0.5em] py-3 text-xl text-brand-active focus:outline-none focus:border-brand-blue disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={isVerifyingSms || !smsCodeSent || !isSmsCodeReady}
              className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
            >
              {isVerifyingSms && <Loader2 size={16} className="animate-spin" />}
              {isVerifyingSms ? "در حال بررسی..." : "تأیید و ورود"}
            </button>
            <button
              type="button"
              onClick={() => requestSmsCode()}
              disabled={smsCooldown > 0 || isSendingSms}
              className="self-center flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white disabled:text-brand-surface_m disabled:cursor-not-allowed transition-colors"
            >
              {isSendingSms && <Loader2 size={12} className="animate-spin" />}
              {smsCooldown > 0 ? `ارسال مجدد کد تا ${smsCooldown} ثانیه دیگر` : "ارسال مجدد کد"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={switchToTotp}
          className="self-center flex items-center gap-1.5 text-xs font-bold text-brand-m_khonsa hover:text-white transition-colors"
        >
          <KeyRound size={13} />
          بازگشت به ورود با Authenticator
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
          <div className="bg-white p-3 rounded">
            <QRCodeSVG value={setupData.otpauthUrl} size={160} level="M" />
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
        onChange={(e) => setCode(toEnglishDigits(e.target.value))}
        maxLength={6}
        dir="ltr"
        placeholder="۶ رقمی"
        disabled={isVerifying}
        className="w-full bg-brand-bg border border-brand-surface_hover text-center tracking-[0.4em] py-3 text-xl text-brand-active focus:outline-none focus:border-brand-blue disabled:opacity-50 transition-colors"
      />

      <button
        type="submit"
        disabled={isVerifying || code.length !== 6}
        className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isVerifying && <Loader2 size={16} className="animate-spin" />}
        {isVerifying ? "در حال بررسی..." : "تأیید"}
      </button>

      {!requiresSetup && (
        <button
          type="button"
          onClick={switchToSms}
          className="self-center flex items-center gap-1.5 text-xs font-bold text-brand-m_khonsa hover:text-white transition-colors"
        >
          <MessageSquareText size={13} />
          مشکلی با Authenticator داری؟ با پیامک وارد شو
        </button>
      )}
    </form>
  );
}