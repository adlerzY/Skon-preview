"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

interface OtpStepProps {
  phone: string;
  initialCooldown: number;
  onBack: () => void;
  onNeedsProfile: (code: string) => void;
  onAdminTotp: (pendingTicket: string, requiresSetup: boolean) => void;
}

const OTP_LENGTH = 5;

export default function OtpStep({ phone, initialCooldown, onBack, onNeedsProfile, onAdminTotp }: OtpStepProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const submitCode = async (submittedCode: string) => {
    setError("");
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: submittedCode }),
      });
      const data = await res.json();

      if (data?.requiresProfile) {
        onNeedsProfile(submittedCode);
        return;
      }

      if (!res.ok && !data?.requiresAdminTotp && !data?.requiresAdminTotpSetup) {
        setError(data?.error || "کد وارد شده صحیح نیست");
        return;
      }

      if (data.requiresAdminTotp || data.requiresAdminTotpSetup) {
        onAdminTotp(data.pendingTicket, Boolean(data.requiresAdminTotpSetup));
        return;
      }

      if (data.success) {
        router.refresh();
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < OTP_LENGTH) {
      setError("کد تأیید را کامل وارد کنید");
      return;
    }
    await submitCode(trimmed);
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/phone/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "ارسال مجدد کد با خطا مواجه شد");
        return;
      }
      setCooldown(data.cooldownSeconds ?? 60);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1 text-xs text-brand-m_khonsa hover:text-white transition-colors"
      >
        <ArrowRight size={14} />
        تغییر شماره
      </button>

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5 items-center text-center">
        <label className="text-xs font-bold text-brand-surface_m">
          کد تأیید ارسال‌شده به <span dir="ltr">{phone}</span> را وارد کنید
        </label>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
          maxLength={OTP_LENGTH}
          dir="ltr"
          placeholder="⋅ ⋅ ⋅ ⋅ ⋅"
          className="w-full max-w-[200px] bg-brand-bg border border-brand-surface_hover text-center tracking-[0.5em] py-3 text-xl text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isVerifying}
        className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isVerifying && <Loader2 size={16} className="animate-spin" />}
        {isVerifying ? "در حال بررسی..." : "تأیید و ورود"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || isResending}
        className="self-center flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-white disabled:text-brand-surface_m disabled:cursor-not-allowed transition-colors"
      >
        {isResending && <Loader2 size={12} className="animate-spin" />}
        {cooldown > 0 ? `ارسال مجدد کد تا ${cooldown} ثانیه دیگر` : isResending ? "در حال ارسال..." : "ارسال مجدد کد"}
      </button>
    </form>
  );
}