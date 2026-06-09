"use client";

import React, { useState, useEffect } from "react";
import { VariationCard } from "@/lib/graphql";
import { useCart } from "@/context/CartContext";

interface DeliveryAndPriceProps {
  selectedVariation: VariationCard | null;
}

export default function DeliveryAndPrice({ selectedVariation }: DeliveryAndPriceProps) {
  const { addToCart } = useCart();

  // ✅ همه هوک‌ها قبل از هر return تعریف میشن (Rules of Hooks)
  const [deliveryType, setDeliveryType] = useState<"direct" | "gift" | "code" | null>(null);
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [battleTag, setBattleTag] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "success" | "error">("idle");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isDirectDisabled = !selectedVariation || selectedVariation.parsedPrice === null || selectedVariation.parsedPrice === undefined;
  const isGiftDisabled = !selectedVariation || selectedVariation.parsedGiftPrice === "disabled" || selectedVariation.parsedGiftPrice === null || selectedVariation.parsedGiftPrice === undefined;
  const isCodeDisabled = !selectedVariation || selectedVariation.parsedCodePrice === "disabled" || selectedVariation.parsedCodePrice === null || selectedVariation.parsedCodePrice === undefined;

  useEffect(() => {
    if (!selectedVariation) {
      setDeliveryType(null);
      return;
    }
    if (!isDirectDisabled) {
      setDeliveryType("direct");
    } else if (!isGiftDisabled) {
      setDeliveryType("gift");
    } else if (!isCodeDisabled) {
      setDeliveryType("code");
    } else {
      setDeliveryType(null);
    }
  }, [selectedVariation, isDirectDisabled, isGiftDisabled, isCodeDisabled]);

  // ✅ early return بعد از همه هوک‌ها
  if (!selectedVariation) {
    return (
      <div className="text-brand-surface_m text-sm text-center py-4 bg-brand-surface border border-brand-surface_hover">
        محصول در حال حاضر موجود نمی‌باشد.
      </div>
    );
  }

  const currentPrice =
    deliveryType === "gift" ? (typeof selectedVariation.parsedGiftPrice === "number" ? selectedVariation.parsedGiftPrice : null) :
    deliveryType === "code" ? (typeof selectedVariation.parsedCodePrice === "number" ? selectedVariation.parsedCodePrice : null) :
    deliveryType === "direct" ? selectedVariation.parsedPrice : null;

  const regularPrice =
    deliveryType === "gift" ? (typeof selectedVariation.parsedGiftRegularPrice === "number" ? selectedVariation.parsedGiftRegularPrice : null) :
    deliveryType === "code" ? (typeof selectedVariation.parsedCodeRegularPrice === "number" ? selectedVariation.parsedCodeRegularPrice : null) :
    deliveryType === "direct" ? (selectedVariation.parsedRegularPrice ?? null) : null;

  const hasDiscount = regularPrice && currentPrice && regularPrice > currentPrice;

  const handleVerifyBattleTag = async () => {
    if (!battleTag.includes("#")) {
      setVerifyStatus("error");
      return;
    }
    setIsVerifying(true);
    setVerifyStatus("idle");
    try {
      const res = await fetch("/api/check-battletag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleTag }),
      });
      setVerifyStatus(res.ok ? "success" : "error");
    } catch {
      setVerifyStatus("error");
    } finally {
      setIsVerifying(false);
    }
  };

  const isFormValid = () => {
    if (!deliveryType) return false;
    if (deliveryType === "direct") return accountIdentifier.trim().length > 3 && accountPassword.length > 0;
    if (deliveryType === "gift") return verifyStatus === "success";
    if (deliveryType === "code") return true;
    return false;
  };

  const handleAddToCart = async () => {
    if (!isFormValid()) return;
    setIsAddingToCart(true);

    addToCart({
      id: `${selectedVariation.databaseId}-${deliveryType}`,
      databaseId: selectedVariation.databaseId,
      name: selectedVariation.name || "محصول انتخاب شده",
      price: currentPrice || 0,
      deliveryMethod: deliveryType as "gift" | "code" | "direct",
      customFields:
        deliveryType === "gift" ? { battleTag } :
        deliveryType === "direct" ? { email: accountIdentifier, password: accountPassword } :
        undefined,
    });

    setTimeout(() => setIsAddingToCart(false), 1000);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <span className="text-brand-surface_m text-[13px] font-bold uppercase tracking-wide">
          مسیر تحویل محصول:
        </span>
        <div className="grid grid-cols-3 gap-2">

          {/* مستقیم */}
          <div className="relative group flex flex-col">
            <button
              type="button"
              disabled={isDirectDisabled}
              onClick={() => setDeliveryType("direct")}
              className={`h-[90px] border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                isDirectDisabled
                  ? "opacity-30 cursor-not-allowed border-transparent bg-brand-surface"
                  : deliveryType === "direct"
                  ? "bg-brand-blue/10 border-brand-blue text-brand-blue"
                  : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:border-brand-m_khonsa"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="font-bold text-xs">مستقیم</span>
            </button>
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-48 bg-brand-menu border border-brand-surface_hover p-3 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl pointer-events-none">
              <span className="block text-[13px] font-bold text-brand-blue mb-1">فست متد</span>
              <span className="text-[11px] text-brand-m_khonsa leading-relaxed">سریع‌ترین حالت فعال‌سازی. نیازمند ورود موقت به اکانت شما.</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-brand-surface_hover"></div>
            </div>
          </div>

          {/* گیفت */}
          <div className="relative group flex flex-col">
            <button
              type="button"
              disabled={isGiftDisabled}
              onClick={() => setDeliveryType("gift")}
              className={`h-[90px] border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                isGiftDisabled
                  ? "opacity-30 cursor-not-allowed border-transparent bg-brand-surface"
                  : deliveryType === "gift"
                  ? "bg-brand-zard/10 border-brand-zard text-brand-zard"
                  : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:border-brand-m_khonsa"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              <span className="font-bold text-xs">گیفت</span>
            </button>
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-48 bg-brand-menu border border-brand-surface_hover p-3 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl pointer-events-none">
              <span className="block text-[13px] font-bold text-brand-zard mb-1">ارسال به دوستان</span>
              <span className="text-[11px] text-brand-m_khonsa leading-relaxed">نیازمند گذشت ۳ روز از ادد فرند بودن.</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-brand-surface_hover"></div>
            </div>
          </div>

          {/* کد */}
          <div className="relative group flex flex-col">
            <button
              type="button"
              disabled={isCodeDisabled}
              onClick={() => setDeliveryType("code")}
              className={`h-[90px] border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                isCodeDisabled
                  ? "opacity-30 cursor-not-allowed border-transparent bg-brand-surface"
                  : deliveryType === "code"
                  ? "bg-brand-sabz/10 border-brand-sabz text-brand-sabz"
                  : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:border-brand-m_khonsa"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
              <span className="font-bold text-xs">کد اصلی</span>
            </button>
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-48 bg-brand-menu border border-brand-surface_hover p-3 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl pointer-events-none">
              <span className="block text-[13px] font-bold text-brand-sabz mb-1">تحویل در لحظه</span>
              <span className="text-[11px] text-brand-m_khonsa leading-relaxed">کد فعال‌سازی بلافاصله تحویل می‌گردد.</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-brand-surface_hover"></div>
            </div>
          </div>

        </div>
      </div>

      {deliveryType && (
        <div className="bg-brand-surface p-2 border border-brand-surface_hover animate-in fade-in duration-300">

          {deliveryType === "direct" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-brand-blue font-bold">
                🔑 اطلاعات اکانت جهت خرید مستقیم:
              </p>
              <input
                type="text"
                value={accountIdentifier}
                onChange={(e) => setAccountIdentifier(e.target.value)}
                placeholder="ایمیل یا نام کاربری اکانت"
                className="w-full bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
                dir="ltr"
              />
              <input
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="رمز عبور اکانت"
                className="w-full bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors text-left"
                dir="ltr"
              />
            </div>
          )}

          {deliveryType === "gift" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-brand-zard font-bold">
                💡 بتل‌تگ خود را جهت بررسی وارد کنید:
              </p>
              <div className="flex items-stretch gap-2">
                <input
                  type="text"
                  value={battleTag}
                  onChange={(e) => {
                    setBattleTag(e.target.value);
                    setVerifyStatus("idle");
                  }}
                  placeholder="BattleTag#1234"
                  className="flex-1 bg-brand-bg border border-brand-surface_hover p-4 text-sm text-brand-active focus:outline-none focus:border-brand-zard font-mono text-left"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleVerifyBattleTag}
                  disabled={isVerifying || !battleTag}
                  className="bg-brand-blue hover:bg-brand-blue/80 disabled:bg-brand-surface_m text-xs font-bold text-brand-active px-6 transition-colors"
                >
                  {isVerifying ? "بررسی..." : "چک کن"}
                </button>
              </div>
              {verifyStatus === "success" && (
                <span className="text-xs text-brand-sabz font-medium mt-1">✓ شما در لیست فرندهای ما قرار دارید!</span>
              )}
              {verifyStatus === "error" && (
                <span className="text-xs text-red-500 font-medium mt-1">⚠️ بتل‌تگ یافت نشد یا فرمت اشتباه است. (مثال: Name#1234)</span>
              )}
            </div>
          )}

          {deliveryType === "code" && (
            <div className="py-2 text-center flex flex-col items-center gap-2">
              <span className="text-3xl">🚀</span>
              <p className="text-xs text-brand-sabz font-bold leading-relaxed">
                کد اورجینال بلافاصله پس از پرداخت<br />در پنل کاربری نمایش داده می‌شود.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex justify-between items-center bg-brand-surface p-4 border border-brand-surface_hover">
          <span className="text-sm text-brand-surface_m font-medium">مبلغ نهایی:</span>
          {deliveryType === null ? (
            <span className="text-sm text-brand-surface_m">ابتدا روش تحویل را انتخاب کنید</span>
          ) : typeof currentPrice === "number" ? (
            <div className="flex flex-row items-baseline gap-2">
              {hasDiscount && (
                <span className="text-xl text-neutral-500 line-through whitespace-nowrap">
                  {regularPrice?.toLocaleString("fa-IR")}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black text-brand-sabz">{currentPrice.toLocaleString("fa-IR")}</span>
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
