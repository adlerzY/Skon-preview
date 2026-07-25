"use client";

import { useState } from "react";
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

const METHOD_TABS = [
  { value: "otp", label: "کد تأیید پیامکی" },
  { value: "password", label: "رمز عبور" },
] as const;

export default function PhoneLoginFlow() {
  const [step, setStep] = useState<Step>({ name: "phone" });
  const method = step.name === "password" ? "password" : "otp";
  const showMethodTabs = step.name === "phone" || step.name === "password";
  const showHeader = step.name === "phone" || step.name === "otp" || step.name === "password";

  const handleAdminTotp = (pendingTicket: string, requiresSetup: boolean) => {
    setStep({ name: "admin-totp", pendingTicket, requiresSetup });
  };

  return (
    <div className="w-full bg-brand-surface border border-brand-surface_hover p-6 md:p-8 flex flex-col gap-6">
      {showHeader && (
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-xl font-black text-white">ورود یا ثبت‌نام</h1>
          <p className="text-xs text-brand-m_khonsa leading-relaxed">
            با شماره موبایل خود وارد شوید؛ اگر حساب کاربری نداشته باشید، به‌طور خودکار برایتان ساخته می‌شود
          </p>
        </div>
      )}

      {showMethodTabs && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-brand-bg border border-brand-surface_hover">
          {METHOD_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStep(tab.value === "password" ? { name: "password" } : { name: "phone" })}
              className={`py-2.5 text-xs font-bold transition-colors ${
                method === tab.value ? "bg-brand-blue text-white" : "text-brand-m_khonsa hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {step.name === "phone" && (
        <PhoneStep
          onOtpSent={(phone, cooldownSeconds) => setStep({ name: "otp", phone, cooldown: cooldownSeconds })}
        />
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

      {step.name === "password" && <PasswordStep onAdminTotp={handleAdminTotp} />}

      {step.name === "complete-profile" && (
        <CompleteProfileStep phone={step.phone} code={step.code} onAdminTotp={handleAdminTotp} />
      )}

      {step.name === "admin-totp" && (
        <AdminTotpGate pendingTicket={step.pendingTicket} requiresSetup={step.requiresSetup} />
      )}
    </div>
  );
}