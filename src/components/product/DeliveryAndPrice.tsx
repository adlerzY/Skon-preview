"use client";

import React, { useState, useEffect } from "react";
import { VariationCard } from "@/lib/graphql";
import { useCart } from "@/context/CartContext";
import { User, Gift, FileCheck, Eye, EyeOff, ClipboardPaste } from "lucide-react";

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

  const pasteInto = async (setter: (v: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setter(text.trim());
    } catch {
      // دسترسی به کلیپ‌بورد رد شد؛ کاربر می‌تواند دستی تایپ کند
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-brand-blue font-bold">
        🔑 اطلاعات ورود اکانت جهت خرید مستقیم:
      </p>
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="ایمیل اکانت"
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 pl-10 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
          dir="ltr"
          autoComplete="off"
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
          className="w-full bg-brand-bg border border-brand-surface_hover p-3 pl-16 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
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
      <p className="text-[11px] text-brand-m_khonsa">
        🔒 اطلاعات شما فقط تا زمانی که این تب باز است نگه‌داری می‌شود و پیش از ارسال، رمزنگاری می‌شود.
      </p>
    </div>
  );
}

function GiftForm({
  battleTag,
  onBattleTagChange,
  verifyStatus,
  isVerifying,
  onVerify,
  serverMessage,
}: {
  battleTag: string;
  onBattleTagChange: (v: string) => void;
  verifyStatus: "idle" | "friend" | "new-tag" | "error";
  isVerifying: boolean;
  onVerify: () => void;
  serverMessage: string;
}) {
  const pasteBattleTag = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onBattleTagChange(text.trim());
    } catch {
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-brand-zard font-bold">
        💡 بتل‌تگ خود را جهت بررسی وارد کنید:
      </p>
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={battleTag}
            onChange={(e) => onBattleTagChange(e.target.value)}
            placeholder="BattleTag#1234"
            className="w-full bg-brand-bg border border-brand-surface_hover p-4 pl-10 text-sm text-brand-active focus:outline-none focus:border-brand-zard font-mono text-left"
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
        <button
          type="button"
          onClick={onVerify}
          disabled={isVerifying || !battleTag.includes("#")}
          className="bg-brand-blue hover:bg-brand-blue/80 disabled:bg-brand-surface_m text-xs font-bold text-brand-active px-6 transition-colors"
        >
          {isVerifying ? "بررسی..." : "چک کن"}
        </button>
      </div>
      {verifyStatus === "friend" && (
        <span className="text-xs text-brand-sabz font-medium">
          ✓ {serverMessage || "شما در لیست فرندهای ما قرار دارید!"}
        </span>
      )}
      {verifyStatus === "new-tag" && (
        <span className="text-xs text-brand-blue font-medium">
          ℹ️ {serverMessage || "بتل‌تگ جدید؛ سفارش در سبد خرید ثبت می‌شود."}
        </span>
      )}
      {verifyStatus === "error" && (
        <span className="text-xs text-red-500 font-medium">
          ⚠️ {serverMessage || "بتل‌تگ یافت نشد یا فرمت اشتباه است. (مثال: Name#1234)"}
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

type DeliveryType = "direct" | "gift" | "code";

function getDefaultDelivery(v: VariationCard): DeliveryType | null {
  if (v.parsedPrice != null) return "direct";
  if (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") return "gift";
  if (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled") return "code";
  return null;
}

function getPrice(v: VariationCard, type: DeliveryType): number | null {
  switch (type) {
    case "direct":
      return v.parsedPrice ?? null;
    case "gift":
      return typeof v.parsedGiftPrice === "number" ? v.parsedGiftPrice : null;
    case "code":
      return typeof v.parsedCodePrice === "number" ? v.parsedCodePrice : null;
  }
}

function getRegularPrice(v: VariationCard, type: DeliveryType): number | null {
  switch (type) {
    case "direct":
      return v.parsedRegularPrice ?? null;
    case "gift":
      return typeof v.parsedGiftRegularPrice === "number"
        ? v.parsedGiftRegularPrice
        : null;
    case "code":
      return typeof v.parsedCodeRegularPrice === "number"
        ? v.parsedCodeRegularPrice
        : null;
  }
}

interface DeliveryAndPriceProps {
  selectedVariation: VariationCard | null;
  productId: number;
  productName: string;
  selectedAttrs: Record<string, string>;
  groupedAttributes: { name: string; values: any[] }[];
  regionInfo: { name: string; value: string } | null;
}

export default function DeliveryAndPrice({
  selectedVariation,
  productId,
  productName,
  selectedAttrs,
  groupedAttributes,
  regionInfo,
}: DeliveryAndPriceProps) {
  const { addToCart } = useCart();

  const [isMounted, setIsMounted] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [battleTag, setBattleTag] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "friend" | "new-tag" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedVariation) {
      setDeliveryType(null);
      return;
    }
    setDeliveryType(getDefaultDelivery(selectedVariation));
    setEmail("");
    setPassword("");
    setBattleTag("");
    setVerifyStatus("idle");
    setServerMessage("");
  }, [selectedVariation]);

  if (!isMounted) return null;

  if (!selectedVariation) {
    return (
      <div className="text-brand-surface_m text-sm text-center py-4 bg-brand-surface border border-brand-surface_hover">
        محصول در حال حاضر موجود نمی‌باشد.
      </div>
    );
  }

  const isDirectDisabled = selectedVariation.parsedPrice == null;
  const isGiftDisabled =
    selectedVariation.parsedGiftPrice == null ||
    selectedVariation.parsedGiftPrice === "disabled";
  const isCodeDisabled =
    selectedVariation.parsedCodePrice == null ||
    selectedVariation.parsedCodePrice === "disabled";

  const currentPrice = deliveryType ? getPrice(selectedVariation, deliveryType) : null;
  const regularPrice = deliveryType ? getRegularPrice(selectedVariation, deliveryType) : null;
  const hasDiscount = regularPrice != null && currentPrice != null && regularPrice > currentPrice;

  const handleVerifyBattleTag = async () => {
    if (!battleTag.includes("#")) {
      setVerifyStatus("error");
      setServerMessage("فرمت بتل‌تگ نامعتبر است.");
      return;
    }
    setIsVerifying(true);
    setVerifyStatus("idle");
    setServerMessage("");
    try {
      const res = await fetch("/api/check-battletag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleTag }),
      });
      
      const data = await res.json();
      setServerMessage(data.message || "");

      if (res.ok) {
        if (data.isFriend) {
          setVerifyStatus("friend");
        } else {
          setVerifyStatus("new-tag");
        }
      } else {
        setVerifyStatus("error");
      }
    } catch {
      setVerifyStatus("error");
      setServerMessage("خطا در ارتباط با سرور.");
    } finally {
      setIsVerifying(false);
    }
  };

  const isFormValid = (): boolean => {
    if (!deliveryType) return false;
    if (deliveryType === "direct") return email.trim().length > 3 && password.trim().length > 0;
    if (deliveryType === "gift") return verifyStatus === "friend" || verifyStatus === "new-tag";
    if (deliveryType === "code") return true;
    return false;
  };

  const handleAddToCart = () => {
    if (!isFormValid() || !deliveryType || !selectedVariation) return;
    setIsAddingToCart(true);
    const regionValue = regionInfo ? selectedAttrs[regionInfo.name] : undefined;
    const traitValues = groupedAttributes
      .map((g) => selectedAttrs[g.name])
      .filter(Boolean);
    const variationNameValue = traitValues.length > 0 ? traitValues.join(" - ") : undefined;
    const variationIdValue =
      selectedVariation.databaseId !== productId ? selectedVariation.databaseId : undefined;

    addToCart({
      databaseId: selectedVariation.databaseId,
      productId,
      variationId: variationIdValue,
      name: productName,
      price: currentPrice || 0,
      regularPrice: regularPrice || undefined,
      deliveryMethod: deliveryType,
      region: regionValue,
      variationName: variationNameValue,
      customFields:
        deliveryType === "gift"
          ? { battleTag }
          : deliveryType === "direct"
          ? { email, password }
          : undefined,
    });

    setTimeout(() => setIsAddingToCart(false), 1000);
  };

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
        body: "کد فعال‌سازی بلافاصله تحویل می‌گردد.",
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
            <GiftForm
              battleTag={battleTag}
              onBattleTagChange={(v) => {
                setBattleTag(v);
                setVerifyStatus("idle");
                setServerMessage("");
              }}
              verifyStatus={verifyStatus}
              isVerifying={isVerifying}
              onVerify={handleVerifyBattleTag}
              serverMessage={serverMessage}
            />
          )}
          {deliveryType === "code" && <CodeInfo />}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex justify-between items-center bg-brand-surface p-4 border border-brand-surface_hover">
          <span className="text-sm text-brand-surface_m font-medium">مبلغ نهایی:</span>
          {deliveryType === null ? (
            <span className="text-sm text-brand-surface_m">ابتدا روش تحویل را انتخاب کنید</span>
          ) : typeof currentPrice === "number" ? (
            <div className="flex flex-row items-center gap-2 flex-wrap">
              {hasDiscount && (
                <span className="text-sm text-neutral-400 line-through whitespace-nowrap">
                  {regularPrice?.toLocaleString("fa-IR")}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black text-brand-sabz">
                  {currentPrice.toLocaleString("fa-IR")}
                </span>
                <span className="text-xs text-brand-surface_m">تومان</span>
              </div>
            </div>
          ) : (
            <span className="text-red-500 font-bold text-lg">ناموجود</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isFormValid() || isAddingToCart}
          className={`w-full py-5 font-bold text-center text-sm transition-all duration-200 ${
            isFormValid()
              ? "bg-brand-blue text-brand-active hover:bg-[#0062d1]"
              : "bg-brand-surface_hover text-brand-m_khonsa cursor-not-allowed"
          }`}
        >
          {isAddingToCart ? "در حال پردازش..." : "افزودن به سبد خرید"}
        </button>
      </div>
    </div>
  );
}