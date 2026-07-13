"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart, itemNeedsCredentials } from "@/context/CartContext";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Trash2, Globe, Sliders, Loader2, Minus, Plus } from "lucide-react";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE } from "@/lib/auth/constants";
import MissingCredentialsForm from "@/components/cart/MissingCredentialsForm";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalQuantity } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    setIsLoggedIn(getClientCookie(LOGGED_IN_COOKIE) === "1");
  }, []);

  const itemsNeedingCredentials = useMemo(() => cart.filter(itemNeedsCredentials), [cart]);

  const totalOriginalPrice = cart?.reduce((sum: number, item) => {
    const regular = Number(item.regularPrice) || Number(item.price) || 0;
    return sum + regular * item.quantity;
  }, 0) || 0;

  const totalPrice = cart?.reduce((sum: number, item) => sum + Number(item.price) * item.quantity, 0) || 0;
  const totalDiscount = totalOriginalPrice - totalPrice;

  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case "direct":
        return { label: "مستقیم (فست متد)", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" };
      case "gift":
        return { label: "گیفت ۳ روزه", color: "text-brand-zard bg-brand-zard/10 border-brand-zard/20" };
      case "code":
        return { label: "کد اورجینال (آنی)", color: "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20" };
      default:
        return { label: method, color: "text-brand-m_khonsa bg-brand-surface" };
    }
  };

  const handleCheckout = async () => {
    setCheckoutError("");

    if (!isLoggedIn) {
      window.location.href = "/my-account";
      return;
    }

    if (itemsNeedingCredentials.length > 0) {
      setCheckoutError("لطفاً اطلاعات ناقص آیتم‌های مشخص‌شده را قبل از پرداخت تکمیل کنید");
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
            deliveryMethod: item.deliveryMethod,
            region: item.region,
            variationName: item.variationName,
            customFields: item.customFields,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data?.error || "خطا در ثبت سفارش");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setCheckoutError("خطا در ارتباط با سرور");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 bg-brand-bg p-6 text-center">
        <span className="text-5xl">🛒</span>
        <h1 className="text-xl font-bold text-brand-active">سبد خرید شما خالی است!</h1>
        <p className="text-sm text-brand-surface_m max-w-xs">
          در حال حاضر هیچ محصولی در سبد خرید شما وجود ندارد. می‌توانید برای مشاهده محصولات به فروشگاه برگردید.
        </p>
        <Link
          href="/"
          className="mt-2 bg-brand-blue text-brand-active px-6 py-3 font-bold text-sm hover:bg-[#0062d1] transition-colors"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 bg-brand-bg text-brand-active">
      <h1 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-2">
        <span>🛒</span> سبد خرید شما ({totalQuantity.toLocaleString("fa-IR")} مورد)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cart.map((item) => {
            const delivery = getDeliveryLabel(item.deliveryMethod);
            const needsCreds = itemNeedsCredentials(item);
            return (
              <div
                key={item.id}
                className="bg-brand-surface border border-brand-surface_hover p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4 relative animate-in fade-in duration-200"
              >
                <div className="flex flex-col gap-2.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base md:text-lg text-brand-active">{item.name}</h3>
                    {item.quantity > 1 && (
                      <span className="text-xs font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-2 py-0.5">
                        {item.quantity.toLocaleString("fa-IR")}x
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2.5 py-1 border font-bold ${delivery.color}`}>
                      {delivery.label}
                    </span>

                    {item.region && (
                      <span className="text-brand-blue bg-brand-blue/5 px-2.5 py-1 border border-brand-blue/20 font-bold flex items-center gap-1 uppercase">
                        <Globe size={13} />
                        ریجن: {item.region}
                      </span>
                    )}
                    {item.variationName && (
                      <span className="text-brand-active bg-brand-bg px-2.5 py-1 border border-brand-surface_hover font-bold flex items-center gap-1">
                        <Sliders size={13} />
                        ویژگی: {item.variationName}
                      </span>
                    )}
                    {item.customFields?.email && (
                      <span className="text-brand-m_khonsa bg-brand-bg px-2 py-1 border border-brand-surface_hover dir-ltr font-mono">
                        📧 {item.customFields.email}
                      </span>
                    )}
                    {item.customFields?.battleTag && (
                      <span className="text-brand-m_khonsa bg-brand-bg px-2 py-1 border border-brand-surface_hover dir-ltr font-mono">
                        🎮 {item.customFields.battleTag}
                      </span>
                    )}
                  </div>

                  {needsCreds && <MissingCredentialsForm item={item} />}

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-brand-bg border border-brand-surface_hover text-brand-m_khonsa hover:text-white hover:border-brand-surface_m transition-colors"
                      aria-label="کاهش تعداد"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity.toLocaleString("fa-IR")}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-brand-bg border border-brand-surface_hover text-brand-m_khonsa hover:text-white hover:border-brand-surface_m transition-colors"
                      aria-label="افزایش تعداد"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex md:flex-col justify-between items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-brand-surface_hover">
                  <Button
                    variant="ghost"
                    onClick={() => removeFromCart(item.id)}
                    className="!text-red-500 hover:!text-red-400 text-xs font-bold flex items-center gap-1 order-2 md:order-1"
                  >
                    <Trash2 size={15} />
                    حذف محصول
                  </Button>

                  <div className="flex items-baseline gap-1 order-1 md:order-2">
                    <span className="text-xl font-black text-brand-sabz">
                      {(item.price * item.quantity).toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[11px] text-brand-surface_m">تومان</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-brand-surface border border-brand-surface_hover p-5 flex flex-col gap-4 lg:sticky lg:top-6">
          <h2 className="font-bold text-sm text-brand-surface_m uppercase tracking-wide border-b border-brand-surface_hover pb-3">
            خلاصه فاکتور
          </h2>

          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-m_khonsa">قیمت محصولات:</span>
            <span className="font-medium">{totalOriginalPrice.toLocaleString("fa-IR")} تومان</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-brand-m_khonsa">سود شما از این خرید:</span>
            <span className="text-brand-sabz font-bold">
              {totalDiscount > 0 ? `${totalDiscount.toLocaleString("fa-IR")} تومان` : "۰ تومان"}
            </span>
          </div>

          <div className="border-t border-brand-surface_hover my-1" />

          <div className="flex justify-between items-center">
            <span className="font-bold text-sm">مبلغ قابل پرداخت:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-sabz">
                {totalPrice.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-brand-surface_m">تومان</span>
            </div>
          </div>

          {!isLoggedIn && (
            <p className="text-[11px] text-brand-zard bg-brand-zard/10 border border-brand-zard/20 p-2.5">
              برای تکمیل خرید ابتدا باید وارد حساب کاربری شوید.
            </p>
          )}

          {itemsNeedingCredentials.length > 0 && (
            <p className="text-[11px] text-brand-zard bg-brand-zard/10 border border-brand-zard/20 p-2.5">
              {itemsNeedingCredentials.length.toLocaleString("fa-IR")} آیتم نیازمند تکمیل اطلاعات است.
            </p>
          )}

          {checkoutError && (
            <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">
              {checkoutError}
            </p>
          )}

          <Button
            variant="primary"
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full py-4 mt-2 disabled:opacity-60"
          >
            {isCheckingOut ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> در حال انتقال...
              </span>
            ) : isLoggedIn ? (
              "تکمیل سفارش و پرداخت"
            ) : (
              "ورود و تکمیل سفارش"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}