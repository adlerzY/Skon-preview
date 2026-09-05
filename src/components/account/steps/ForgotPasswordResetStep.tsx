"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

const CODE_LENGTH = 5;

export default function ForgotPasswordResetStep({
  identifier,
  channel,
  initialCooldown,
  onBack,
  onDone,
}: {
  identifier: string;
  channel: string;
  initialCooldown: number;
  onBack: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.trim().length < CODE_LENGTH) {
      setError("کد تأیید را کامل وارد کنید");
      return;
    }
    if (newPassword.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code: code.trim(), newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "بازیابی رمز عبور با خطا مواجه شد");
        return;
      }

      if (data.requiresLogin) {
        setIsDone(true);
        return;
      }

      router.refresh();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/password/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
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

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <CheckCircle2 size={32} className="text-brand-sabz" />
        <p className="text-sm text-white font-bold">رمز عبور با موفقیت تغییر کرد</p>
        <p className="text-xs text-brand-m_khonsa leading-relaxed">برای ورود به حساب کاربری، دوباره وارد شوید.</p>
        <button
          type="button"
          onClick={onDone}
          className="bg-brand-blue hover:bg-[#0062d1] text-white text-sm font-bold px-6 py-2.5 transition-colors"
        >
          بازگشت به ورود
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1 text-xs text-brand-m_khonsa hover:text-white transition-colors"
      >
        <ArrowRight size={14} />
        تغییر شماره یا ایمیل
      </button>

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 text-center">
          {error}
        </p>
      )}

      <p className="text-xs text-brand-m_khonsa text-center leading-relaxed">
        کد تأیید به {channel === "email" ? "ایمیل" : "شماره موبایل"}{" "}
        <span dir="ltr" className="text-white font-bold">
          {identifier}
        </span>{" "}
        ارسال شد.
      </p>

      <div className="flex flex-col gap-1.5 items-center text-center">
        <label className="text-xs font-bold text-brand-surface_m">کد تأیید</label>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
          maxLength={CODE_LENGTH}
          dir="ltr"
          placeholder="⋅ ⋅ ⋅ ⋅ ⋅"
          className="w-full max-w-[200px] bg-brand-bg border border-brand-surface_hover text-center tracking-[0.5em] py-3 text-xl text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">رمز عبور جدید</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-surface_m">تکرار رمز عبور جدید</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? "در حال ثبت..." : "ثبت رمز عبور جدید"}
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