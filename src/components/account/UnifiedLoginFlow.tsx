"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import PhoneStep from "./steps/PhoneStep";
import OtpStep from "./steps/OtpStep";
import CredentialsStep from "./steps/CredentialsStep";
import CompleteProfileStep from "./steps/CompleteProfileStep";
import ForgotPasswordRequestStep from "./steps/ForgotPasswordRequestStep";
import ForgotPasswordResetStep from "./steps/ForgotPasswordResetStep";
import AdminTotpGate from "./steps/AdminTotpGate";

type Step =
  | { name: "phone" }
  | { name: "otp"; phone: string; cooldown: number }
  | { name: "complete-profile"; phone: string; code: string }
  | { name: "credentials" }
  | { name: "forgot-request" }
  | { name: "forgot-reset"; identifier: string; channel: string; cooldown: number }
  | { name: "admin-totp"; pendingTicket: string; requiresSetup: boolean };

export default function UnifiedLoginFlow() {
  const [step, setStep] = useState<Step>({ name: "phone" });

  const handleAdminTotp = (pendingTicket: string, requiresSetup: boolean) => {
    setStep({ name: "admin-totp", pendingTicket, requiresSetup });
  };

  const isEntryStep = step.name === "phone" || step.name === "credentials";

  const title =
    step.name === "credentials"
      ? "ورود با رمز عبور"
      : step.name === "forgot-request" || step.name === "forgot-reset"
      ? "بازیابی رمز عبور"
      : step.name === "admin-totp"
      ? ""
      : "ورود یا عضویت";

  const subtitle =
    step.name === "phone"
      ? "با شماره موبایل خود وارد شوید؛ اگر حساب کاربری نداشته باشید، به‌طور خودکار برایتان ساخته می‌شود"
      : step.name === "credentials"
      ? "شماره موبایل یا ایمیل و رمز عبور حساب خود را وارد کنید"
      : step.name === "forgot-request"
      ? "شماره موبایل یا ایمیل حساب خود را وارد کنید تا کد بازیابی برایتان ارسال شود"
      : step.name === "forgot-reset"
      ? "کد ارسال‌شده و رمز عبور جدید را وارد کنید"
      : "";

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
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-brand-m_khonsa hover:text-white transition-colors"
        >
          <ChevronRight size={14} />
          بازگشت به فروشگاه
        </Link>
      </div>

      {(title || subtitle) && (
        <div className="text-center flex flex-col gap-1">
          {title && <h1 className="text-xl font-black text-white">{title}</h1>}
          {subtitle && <p className="text-xs text-brand-m_khonsa leading-relaxed">{subtitle}</p>}
        </div>
      )}

      {isEntryStep && (
        <div className="grid grid-cols-2 gap-1.5 bg-brand-bg p-1 border border-brand-surface_hover">
          <button
            type="button"
            onClick={() => setStep({ name: "phone" })}
            className={`py-2.5 text-xs font-bold transition-colors ${
              step.name === "phone" ? "bg-brand-blue text-white" : "text-brand-m_khonsa hover:text-white"
            }`}
          >
            ورود سریع با کد
          </button>
          <button
            type="button"
            onClick={() => setStep({ name: "credentials" })}
            className={`py-2.5 text-xs font-bold transition-colors ${
              step.name === "credentials" ? "bg-brand-blue text-white" : "text-brand-m_khonsa hover:text-white"
            }`}
          >
            ورود با رمز عبور
          </button>
        </div>
      )}

      {step.name === "phone" && (
        <PhoneStep onOtpSent={(phone, cooldownSeconds) => setStep({ name: "otp", phone, cooldown: cooldownSeconds })} />
      )}

      {step.name === "otp" && (
        <OtpStep
          phone={step.phone}
          initialCooldown={step.cooldown}
          onBack={() => setStep({ name: "phone" })}
          onNeedsProfile={(code) => setStep({ name: "complete-profile", phone: step.phone, code })}
          onAdminTotp={handleAdminTotp}
        />
      )}

      {step.name === "complete-profile" && (
        <CompleteProfileStep phone={step.phone} code={step.code} onAdminTotp={handleAdminTotp} />
      )}

      {step.name === "credentials" && (
        <CredentialsStep onAdminTotp={handleAdminTotp} onForgotPassword={() => setStep({ name: "forgot-request" })} />
      )}

      {step.name === "forgot-request" && (
        <ForgotPasswordRequestStep
          onBack={() => setStep({ name: "credentials" })}
          onCodeSent={(identifier, channel, cooldownSeconds) =>
            setStep({ name: "forgot-reset", identifier, channel, cooldown: cooldownSeconds })
          }
        />
      )}

      {step.name === "forgot-reset" && (
        <ForgotPasswordResetStep
          identifier={step.identifier}
          channel={step.channel}
          initialCooldown={step.cooldown}
          onBack={() => setStep({ name: "forgot-request" })}
          onDone={() => setStep({ name: "credentials" })}
        />
      )}

      {step.name === "admin-totp" && (
        <AdminTotpGate pendingTicket={step.pendingTicket} requiresSetup={step.requiresSetup} />
      )}
    </div>
  );
}