"use client";

import React, { useState } from "react";
import { VariationCard } from "@/lib/graphql";
import { User, Gift, FileCheck, Eye, EyeOff, ClipboardPaste } from "lucide-react";
import { PriceDisplay } from "./PriceDisplay";
import { useToast } from "@/context/ToastContext";
import ConfettiBurst from "@/components/ui/ConfettiBurst";
import type { ProductPurchaseState, DeliveryType } from "./useProductDelivery";
import { BATTLETAG_REGEX } from "./validation";

function DirectForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const pasteInto = async (setter: (v: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setter(text.trim());
    } catch {
      showToast("دسترسی به کلیپ‌بورد امکان‌پذیر نیست.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="ایمیل اکانت"
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 pl-10 text-base md:text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
          dir="ltr"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          type="button"
          onClick={() => pasteInto(onEmailChange)}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-m_khonsa hover:text-brand-blue transition-colors p-1"
          aria-label="چسباندن ایمیل"
          tabIndex={-1}
        >
          <ClipboardPaste size={15} />
        </button>
      </div>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="پسورد اکانت"
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 pl-16 text-base md:text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
          dir="ltr"
          autoComplete="new-password"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => pasteInto(onPasswordChange)}
            className="text-brand-m_khonsa hover:text-brand-blue transition-colors p-1"
            aria-label="چسباندن پسورد"
            tabIndex={-1}
          >
            <ClipboardPaste size={15} />
          </button>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-brand-m_khonsa hover:text-brand-blue transition-colors p-1"
            aria-label={showPassword ? "مخفی کردن پسورد" : "نمایش پسورد"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function GiftForm({
  battleTag,
  onBattleTagChange,
}: {
  battleTag: string;
  onBattleTagChange: (v: string) => void;
}) {
  const { showToast } = useToast();

  const pasteBattleTag = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onBattleTagChange(text.trim());
    } catch {
      showToast("دسترسی به کلیپ‌بورد امکان‌پذیر نیست.");
    }
  };

  const trimmed = battleTag.trim();
  const showError = trimmed.length > 0 && !BATTLETAG_REGEX.test(trimmed);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-brand-zard font-bold">
        💡 بتل‌تگ خود را جهت ارسال گیفت وارد کنید:
      </p>
      <div className="relative">
        <input
          type="text"
          value={battleTag}
          onChange={(e) => onBattleTagChange(e.target.value)}
          placeholder="BattleTag#1234"
          className="w-full bg-brand-bg border border-brand-surface_hover p-4 pl-10 text-base md:text-sm text-brand-active focus:outline-none focus:border-brand-zard font-mono text-left"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={pasteBattleTag}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-m_khonsa hover:text-brand-zard transition-colors p-1"
          aria-label="چسباندن بتل‌تگ"
          tabIndex={-1}
        >
          <ClipboardPaste size={15} />
        </button>
      </div>
      {showError && (
        <span className="text-xs text-red-500 font-medium">
          ⚠️ فرمت بتل‌تگ نامعتبر است. مثال: Name#1234
        </span>
      )}
    </div>
  );
}

function CodeInfo() {
  return (
    <div className="py-2 text-center flex flex-col items-center gap-2">
      <span className="text-3xl">🚀</span>
      <p className="text-xs text-brand-sabz font-bold leading-relaxed">
        کد اورجینال بلافاصله پس از پرداخت
        <br />
        در پنل کاربری نمایش داده می‌شود.
      </p>
    </div>
  );
}

interface DeliveryAndPriceProps {
  selectedVariation: VariationCard | null;
  purchase: ProductPurchaseState;
}

export default function DeliveryAndPrice({ selectedVariation, purchase }: DeliveryAndPriceProps) {
  const {
    deliveryType,
    setDeliveryType,
    email,
    setEmail,
    password,
    setPassword,
    battleTag,
    setBattleTag,
    isAddingToCart,
    burstKey,
    isDirectDisabled,
    isGiftDisabled,
    isCodeDisabled,
    currentPrice,
    regularPrice,
    isFormValid,
    handleAddToCart,
    isCartFull,
  } = purchase;

  if (!selectedVariation) {
    return (
      <div className="text-brand-surface_m text-sm text-center py-4 bg-brand-surface border border-brand-surface_hover">
        محصول در حال حاضر موجود نمی‌باشد.
      </div>
    );
  }

  const deliveryButtons: {
    type: DeliveryType;
    disabled: boolean;
    activeColor: string;
    label: string;
    tooltip: { title: string; titleColor: string; body: string };
    icon: React.ReactNode;
  }[] = [
    {
      type: "direct",
      disabled: isDirectDisabled,
      activeColor: "bg-brand-blue/10 border-brand-blue text-brand-blue",
      label: "مستقیم",
      tooltip: {
        title: "فست متد",
        titleColor: "text-brand-blue",
        body: "سریع‌ترین حالت فعال‌سازی. نیازمند اطلاعات ورود اکانت شما.",
      },
      icon: <User size={22} strokeWidth={2} />,
    },
    {
      type: "gift",
      disabled: isGiftDisabled,
      activeColor: "bg-brand-zard/10 border-brand-zard text-brand-zard",
      label: "گیفت",
      tooltip: {
        title: "ارسال به دوستان",
        titleColor: "text-brand-zard",
        body: "نیازمند گذشت ۳ روز از ادد فرند بودن.",
      },
      icon: <Gift size={22} strokeWidth={2} />,
    },
    {
      type: "code",
      disabled: isCodeDisabled,
      activeColor: "bg-brand-sabz/10 border-brand-sabz text-brand-sabz",
      label: "کد اصلی",
      tooltip: {
        title: "تحویل در لحظه",
        titleColor: "text-brand-sabz",
        body: "کد فعال‌سازی بلافاصله پس از پرداخت تحویل می‌گردد.",
      },
      icon: <FileCheck size={22} strokeWidth={2} />,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <span className="text-brand-surface_m text-[13px] font-bold uppercase tracking-wide">
          مسیر تحویل محصول:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {deliveryButtons.map(({ type, disabled, activeColor, label, tooltip, icon }) => (
            <div key={type} className="relative group flex flex-col">
              <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setDeliveryType(type)}
                className={`h-[90px] border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                  disabled
                    ? "opacity-30 cursor-not-allowed border-transparent bg-brand-surface"
                    : deliveryType === type
                    ? activeColor
                    : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:border-brand-m_khonsa"
                }`}
              >
                {icon}
                <span className="font-bold text-xs">{label}</span>
              </button>
              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-48 bg-brand-menu border border-brand-surface_hover p-3 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl pointer-events-none">
                <span className={`block text-[13px] font-bold mb-1 ${tooltip.titleColor}`}>
                  {tooltip.title}
                </span>
                <span className="text-[11px] text-brand-m_khonsa leading-relaxed">
                  {tooltip.body}
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-brand-surface_hover" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {deliveryType && (
        <div className="bg-brand-surface p-2 border border-brand-surface_hover animate-in fade-in duration-300">
          {deliveryType === "direct" && (
            <DirectForm
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
            />
          )}
          {deliveryType === "gift" && (
            <GiftForm battleTag={battleTag} onBattleTagChange={setBattleTag} />
          )}
          {deliveryType === "code" && <CodeInfo />}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        {selectedVariation.commissionDiscountBadge && (
          <div className="self-start bg-brand-sabz/10 border border-brand-sabz/40 text-brand-sabz px-3 py-1 text-xs font-bold">
            تخفیف ویژه فروشگاه
          </div>
        )}
        <div className="flex justify-between items-center bg-brand-surface p-4 border border-brand-surface_hover">
          <span className="text-sm text-brand-surface_m font-medium">مبلغ نهایی:</span>
          {deliveryType === null ? (
            <span className="text-sm text-brand-surface_m">ابتدا روش تحویل را انتخاب کنید</span>
          ) : typeof currentPrice === "number" ? (
            <PriceDisplay price={currentPrice} regularPrice={regularPrice ?? undefined} />
          ) : (
            <span className="text-red-500 font-bold text-lg">ناموجود</span>
          )}
        </div>

        <div className="relative">
          <ConfettiBurst trigger={burstKey} />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isFormValid() || isAddingToCart || isCartFull}
            className={`w-full py-5 font-bold text-center text-sm transition-all duration-200 ${
              isFormValid() && !isCartFull
                ? "bg-brand-blue text-brand-active hover:bg-[#0062d1]"
                : "bg-brand-surface_hover text-brand-m_khonsa cursor-not-allowed"
            }`}
          >
            {isAddingToCart
              ? "در حال پردازش..."
              : isCartFull
              ? "سبد خرید پر است (حداکثر ۱۰ عدد)"
              : "افزودن به سبد خرید"}
          </button>
        </div>
      </div>
    </div>
  );
}