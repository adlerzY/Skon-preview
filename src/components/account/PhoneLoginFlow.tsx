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

export default function PhoneLoginFlow() {
  const [step, setStep] = useState<Step>({ name: "phone" });

  const handleAdminTotp = (pendingTicket: string, requiresSetup: boolean) => {
    setStep({ name: "admin-totp", pendingTicket, requiresSetup });
  };

  const showGenericHeader = step.name === "phone" || step.name === "otp" || step.name === "password";

  return (
    <div className="bg-brand-surface border border-brand-surface_hover p-6 md:p-8 flex flex-col gap-6 max-w-md mx-auto">
      {showGenericHeader && (
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-xl font-black text-white">ورود به حساب کاربری</h1>
          <p className="text-xs text-brand-m_khonsa">
            برای ثبت نظر و تکمیل خرید باید وارد حساب خود شوید
          </p>
        </div>
      )}

      {step.name === "phone" && (
        <div className="flex flex-col gap-4">
          <PhoneStep
            onOtpSent={(phone, cooldownSeconds) =>
              setStep({ name: "otp", phone, cooldown: cooldownSeconds })
            }
          />
          <button
            type="button"
            onClick={() => setStep({ name: "password" })}
            className="self-center text-xs text-brand-m_khonsa hover:text-white transition-colors"
          >
            ورود با رمز عبور
          </button>
        </div>
      )}

      {step.name === "otp" && (
        <OtpStep
          phone={step.phone}
          initialCooldown={step.cooldown}
          onBack={() => setStep({ name: "phone" })}
          onNeedsProfile={(code) =>
            setStep({ name: "complete-profile", phone: step.phone, code })
          }
          onAdminTotp={handleAdminTotp}
        />
      )}

      {step.name === "password" && (
        <PasswordStep
          onBack={() => setStep({ name: "phone" })}
          onAdminTotp={handleAdminTotp}
        />
      )}

      {step.name === "complete-profile" && (
        <CompleteProfileStep
          phone={step.phone}
          code={step.code}
          onAdminTotp={handleAdminTotp}
        />
      )}

      {step.name === "admin-totp" && (
        <AdminTotpGate
          pendingTicket={step.pendingTicket}
          requiresSetup={step.requiresSetup}
        />
      )}
    </div>
  );
}