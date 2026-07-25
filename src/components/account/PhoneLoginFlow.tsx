// src/components/account/PhoneLoginFlow.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import PhoneStep from "./steps/PhoneStep";
import OtpStep from "./steps/OtpStep";
import PasswordStep from "./steps/PasswordStep";
import CompleteProfileStep from "./steps/CompleteProfileStep";
import AdminTotpGate from "./steps/AdminTotpGate";

type Step =
  | { name: "phone" }
  | { name: "otp"; phone: string; cooldown: number }
  | { name: "password" }
  | { name: "complete-profile"; phone: string; code: string }
  | { name: "admin-totp"; pendingTicket: string; requiresSetup: boolean };

export default function PhoneLoginFlow() {
  const [step, setStep] = useState<Step>({ name: "phone" });

  const handleAdminTotp = (pendingTicket: string, requiresSetup: boolean) => {
    setStep({ name: "admin-totp", pendingTicket, requiresSetup });
  };

  const showHeader = step.name === "phone" || step.name === "password";
  const title = step.name === "password" ? "ورود با رمز عبور" : "ورود یا عضویت";
  const subtitle =
    step.name === "phone"
      ? "با شماره موبایل خود وارد شوید؛ اگر حساب کاربری نداشته باشید، به‌طور خودکار برایتان ساخته می‌شود"
      : "شماره موبایل و رمز عبور حساب خود را وارد کنید";

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

      {showHeader && (
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-xl font-black text-white">{title}</h1>
          <p className="text-xs text-brand-m_khonsa leading-relaxed">{subtitle}</p>
        </div>
      )}

      {step.name === "phone" && (
        <>
          <PhoneStep onOtpSent={(phone, cooldownSeconds) => setStep({ name: "otp", phone, cooldown: cooldownSeconds })} />
          <button
            type="button"
            onClick={() => setStep({ name: "password" })}
            className="self-center text-xs font-bold text-brand-blue hover:text-white transition-colors"
          >
            ورود با رمز عبور
          </button>
        </>
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

      {step.name === "password" && (
        <>
          <PasswordStep onAdminTotp={handleAdminTotp} />
          <button
            type="button"
            onClick={() => setStep({ name: "phone" })}
            className="self-center flex items-center gap-1 text-xs font-bold text-brand-m_khonsa hover:text-white transition-colors"
          >
            <ChevronRight size={13} />
            بازگشت به ورود با کد تأیید
          </button>
        </>
      )}

      {step.name === "complete-profile" && (
        <CompleteProfileStep phone={step.phone} code={step.code} onAdminTotp={handleAdminTotp} />
      )}

      {step.name === "admin-totp" && (
        <AdminTotpGate pendingTicket={step.pendingTicket} requiresSetup={step.requiresSetup} />
      )}
    </div>
  );
}