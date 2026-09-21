"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Trash2, Globe, Sliders, Loader2, Minus, Plus, ShoppingCart, RefreshCw, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useCart, itemNeedsCredentials } from "@/context/CartContext";
import Button from "@/components/ui/Button";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE } from "@/lib/auth/constants";
import MissingCredentialsForm from "@/components/cart/MissingCredentialsForm";
import { useToast } from "@/context/ToastContext";

interface RevalidatedItem {
  index: number;
  unitPrice?: number | null;
  regularPrice?: number | null;
  availableQuantity?: number | null;
  status?: string;
  message?: string;
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, updateItemSnapshot, totalQuantity } = useCart();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [revalidationNotice, setRevalidationNotice] = useState<{ type: "warning" | "success"; text: string } | null>(null);
  const resumeCheckout = searchParams.get("resumeCheckout") === "1";

  useEffect(() => {
    setIsLoggedIn(getClientCookie(LOGGED_IN_COOKIE) === "1");
  }, []);

  useEffect(() => {
    if (!resumeCheckout || !cart.length) return;
    const timer = window.setTimeout(() => {
      document.getElementById("cart-checkout")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [resumeCheckout, cart.length]);

  const itemsNeedingCredentials = useMemo(() => cart.filter(itemNeedsCredentials), [cart]);

  const { totalOriginalPrice, totalPrice, totalDiscount } = useMemo(() => {
    const original = cart.reduce((sum, item) => {
      const regular = Number(item.regularPrice) || Number(item.price) || 0;
      return sum + regular * item.quantity;
    }, 0);
    const current = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    return { totalOriginalPrice: original, totalPrice: current, totalDiscount: Math.max(0, original - current) };
  }, [cart]);

  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case "direct": return { label: "مستقیم (فست متد)", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" };
      case "gift": return { label: "گیفت ۳ روزه", color: "text-brand-zard bg-brand-zard/10 border-brand-zard/20" };
      case "code": return { label: "کد اورجینال (آنی)", color: "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20" };
      default: return { label: method, color: "text-brand-m_khonsa bg-brand-surface" };
    }
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    showToast("از سبد خرید حذف شد");
  };

  const checkoutPayload = () => cart.map((item) => ({
    productId: item.productId,
    variationId: item.variationId,
    quantity: item.quantity,
    price: item.price,
    deliveryMethod: item.deliveryMethod,
    region: item.region,
    variationName: item.variationName,
    customFields: item.customFields,
  }));

  const applyRevalidation = (items: RevalidatedItem[]) => {
    let priceChanged = false;
    let stockProblem = false;
    let unavailable = false;
    let firstNewPrice: number | null = null;

    for (const result of items) {
      const index = Number(result.index);
      const current = cart[index];
      if (!current) continue;
      if (typeof result.unitPrice === "number" && Math.abs(result.unitPrice - current.price) > 0.5) {
        priceChanged = true;
        firstNewPrice = result.unitPrice;
      }
      if (result.status === "out_of_stock") stockProblem = true;
      if (result.status === "unavailable") unavailable = true;
      updateItemSnapshot(current.id, {
        price: typeof result.unitPrice === "number" ? result.unitPrice : undefined,
        regularPrice: typeof result.regularPrice === "number" ? result.regularPrice : undefined,
        maxQuantity: result.availableQuantity == null ? null : Number(result.availableQuantity),
      });
    }

    if (priceChanged) {
      const text = firstNewPrice != null
        ? `قیمت یک یا چند آیتم به‌روزرسانی شد؛ مبلغ جدید ${firstNewPrice.toLocaleString("fa-IR")} تومان است.`
        : "قیمت یک یا چند آیتم به‌روزرسانی شد؛ مبلغ جدید را بررسی کنید.";
      setRevalidationNotice({ type: "warning", text });
      setCheckoutError("");
      return false;
    }
    if (stockProblem) {
      setCheckoutError("موجودی یک یا چند آیتم کافی نیست. مقدار سبد را بررسی کنید.");
      return false;
    }
    if (unavailable) {
      setCheckoutError("یک یا چند آیتم دیگر برای خرید در دسترس نیست.");
      return false;
    }
    setRevalidationNotice({ type: "success", text: "قیمت و موجودی سبد خرید به‌روز است." });
    return true;
  };

  const revalidateCart = async () => {
    setIsRevalidating(true);
    setCheckoutError("");
    try {
      const response = await fetch("/api/cart/revalidate", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutPayload() }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 401 && ["AUTH_REQUIRED", "SESSION_INVALID", "SESSION_REFRESH_FAILED"].includes(String(data?.code))) {
        setIsLoggedIn(false);
        window.location.href = "/my-account?returnTo=/cart&resumeCheckout=1";
        return false;
      }

      if (!response.ok) {
        if (Array.isArray(data?.items)) applyRevalidation(data.items);
        setCheckoutError(data?.error || "بررسی سبد خرید انجام نشد");
        return false;
      }

      return applyRevalidation(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setCheckoutError("خطا در ارتباط با سرور هنگام بررسی سبد خرید");
      return false;
    } finally {
      setIsRevalidating(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutError("");
    setRevalidationNotice(null);

    if (!isLoggedIn) {
      window.location.href = "/my-account?returnTo=/cart&resumeCheckout=1";
      return;
    }

    if (itemsNeedingCredentials.length > 0) {
      setCheckoutError("لطفاً اطلاعات ناقص آیتم‌های مشخص‌شده را قبل از پرداخت تکمیل کنید");
      return;
    }

    setIsCheckingOut(true);
    try {
      const isValid = await revalidateCart();
      if (!isValid) return;

      const checkoutItems = cart.map((item) => ({
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
        deliveryMethod: item.deliveryMethod,
        region: item.region,
        variationName: item.variationName,
        customFields: item.customFields,
      }));
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(checkoutItems)));
      const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const stored = sessionStorage.getItem("btl_checkout_idempotency");
      let idempotencyKey = "";
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { signature?: string; key?: string };
          if (parsed.signature === signature && parsed.key) idempotencyKey = parsed.key;
        } catch {}
      }
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        sessionStorage.setItem("btl_checkout_idempotency", JSON.stringify({ signature, key: idempotencyKey }));
      }

      const res = await fetch("/api/checkout/create", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutItems, idempotencyKey }),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401 && ["AUTH_REQUIRED", "SESSION_INVALID", "SESSION_REFRESH_FAILED"].includes(String(data?.code))) {
        setIsLoggedIn(false);
        window.location.href = "/my-account?returnTo=/cart&resumeCheckout=1";
        return;
      }
      if (!res.ok) {
        setCheckoutError(data?.error || "خطا در ثبت سفارش");
        return;
      }
      if (typeof data?.redirectUrl !== "string" || !data.redirectUrl) {
        setCheckoutError("لینک پرداخت از سرور دریافت نشد");
        return;
      }

      sessionStorage.removeItem("btl_checkout_idempotency");
      clearCart();
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
        <ShoppingCart size={46} className="text-brand-blue" />
        <h1 className="text-xl font-bold text-brand-active">سبد خرید شما خالی است!</h1>
        <p className="text-sm text-brand-surface_m max-w-xs">در حال حاضر هیچ محصولی در سبد خرید شما وجود ندارد.</p>
        <Link href="/" className="mt-2 bg-brand-blue text-brand-active px-6 py-3 font-bold text-sm hover:bg-[#0062d1] transition-colors">بازگشت به فروشگاه</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full max-w-site mx-auto px-4 md:px-6 py-6 md:py-8 text-brand-active">
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-2"><ShoppingCart size={22} /> سبد خرید شما</h1>
          <span className="text-xs md:text-sm text-brand-m_khonsa">{totalQuantity.toLocaleString("fa-IR")} مورد</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] text-brand-m_khonsa">
          <span>قبل از پرداخت، قیمت و موجودی در سرور دوباره بررسی می‌شود.</span>
          <button type="button" onClick={() => void revalidateCart()} disabled={isRevalidating || !isLoggedIn} className="inline-flex items-center gap-1 font-bold text-brand-blue hover:text-white disabled:opacity-40">
            <RefreshCw size={13} className={isRevalidating ? "animate-spin" : ""} /> بررسی مجدد
          </button>
        </div>
      </div>

      {resumeCheckout && isLoggedIn && (
        <div className="mb-4 flex items-center gap-2 border border-brand-blue/20 bg-brand-blue/5 p-3 text-xs text-brand-active">
          <CheckCircle2 size={15} className="text-brand-sabz shrink-0" /> ورود با موفقیت انجام شد؛ می‌توانید پرداخت را ادامه دهید.
        </div>
      )}

      {revalidationNotice && (
        <div className={`mb-4 flex items-start gap-2 border p-3 text-xs leading-5 ${revalidationNotice.type === "warning" ? "border-brand-zard/20 bg-brand-zard/5 text-brand-active" : "border-brand-sabz/20 bg-brand-sabz/5 text-brand-active"}`}>
          {revalidationNotice.type === "warning" ? <AlertTriangle size={15} className="text-brand-zard shrink-0 mt-0.5" /> : <CheckCircle2 size={15} className="text-brand-sabz shrink-0 mt-0.5" />}
          {revalidationNotice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 xl:gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-3">
          {cart.map((item) => {
            const delivery = getDeliveryLabel(item.deliveryMethod);
            const needsCreds = itemNeedsCredentials(item);
            const lineTotal = item.price * item.quantity;
            return (
              <div key={item.id} className="bg-brand-surface border border-brand-surface_hover p-3.5 sm:p-4 md:p-5 flex flex-col sm:flex-row gap-4 relative">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden border border-brand-surface_hover bg-brand-bg flex items-center justify-center">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart size={24} className="text-brand-surface_m" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-bold text-sm md:text-base text-brand-active leading-6">{item.name}</h3>
                      {item.quantity > 1 && <span className="text-[10px] font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-2 py-0.5">{item.quantity.toLocaleString("fa-IR")}x</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] md:text-xs">
                      <span className={`px-2.5 py-1 border font-bold ${delivery.color}`}>{delivery.label}</span>
                      {item.region && <span className="text-brand-blue bg-brand-blue/5 px-2.5 py-1 border border-brand-blue/20 font-bold flex items-center gap-1"><Globe size={12} /> {item.region}</span>}
                      {item.variationName && <span className="text-brand-active bg-brand-bg px-2.5 py-1 border border-brand-surface_hover font-bold flex items-center gap-1"><Sliders size={12} /> {item.variationName}</span>}
                    </div>
                    {item.customFields?.email && <div className="mt-1.5 text-[10px] text-brand-m_khonsa dir-ltr font-mono">📧 {item.customFields.email}</div>}
                    {item.customFields?.battleTag && <div className="mt-1.5 text-[10px] text-brand-m_khonsa dir-ltr font-mono">🎮 {item.customFields.battleTag}</div>}
                    {needsCreds && <div className="mt-3"><MissingCredentialsForm item={item} /></div>}
                  </div>
                </div>

                <div className="flex sm:flex-col justify-between sm:items-end gap-3 sm:min-w-[155px] border-t sm:border-t-0 sm:border-r border-brand-surface_hover pt-3 sm:pt-0 sm:pr-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-brand-bg border border-brand-surface_hover text-brand-m_khonsa hover:text-white hover:border-brand-surface_m transition-colors" aria-label="کاهش تعداد"><Minus size={13} /></button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity.toLocaleString("fa-IR")}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={typeof item.maxQuantity === "number" && item.quantity >= item.maxQuantity} className="w-7 h-7 flex items-center justify-center bg-brand-bg border border-brand-surface_hover text-brand-m_khonsa hover:text-white hover:border-brand-surface_m transition-colors disabled:opacity-40" aria-label="افزایش تعداد"><Plus size={13} /></button>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline gap-1 justify-end"><span className="text-lg md:text-xl font-black text-brand-sabz">{lineTotal.toLocaleString("fa-IR")}</span><span className="text-[10px] text-brand-surface_m">تومان</span></div>
                    {item.quantity > 1 && <div className="mt-1 text-[10px] text-brand-m_khonsa">هر عدد: {item.price.toLocaleString("fa-IR")} تومان</div>}
                  </div>
                  <button type="button" onClick={() => handleRemove(item.id)} className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 self-end"><Trash2 size={14} /> حذف محصول</button>
                </div>
              </div>
            );
          })}
        </div>

        <div id="cart-checkout" className="bg-brand-surface border border-brand-surface_hover p-4 md:p-5 flex flex-col gap-4 lg:sticky lg:top-6">
          <h2 className="font-bold text-sm text-brand-surface_m border-b border-brand-surface_hover pb-3">خلاصه سفارش</h2>
          <div className="flex justify-between items-center text-sm"><span className="text-brand-m_khonsa">قیمت محصولات:</span><span className="font-medium">{totalOriginalPrice.toLocaleString("fa-IR")} تومان</span></div>
          <div className="flex justify-between items-center text-sm"><span className="text-brand-m_khonsa">سود شما:</span><span className="text-brand-sabz font-bold">{totalDiscount > 0 ? `${totalDiscount.toLocaleString("fa-IR")} تومان` : "۰ تومان"}</span></div>
          <div className="border-t border-brand-surface_hover" />
          <div className="flex justify-between items-center"><span className="font-bold text-sm">مبلغ قابل پرداخت:</span><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-brand-sabz">{totalPrice.toLocaleString("fa-IR")}</span><span className="text-xs text-brand-surface_m">تومان</span></div></div>

          {!isLoggedIn && <p className="text-[11px] text-brand-zard bg-brand-zard/10 border border-brand-zard/20 p-2.5">برای پرداخت و ایجاد سفارش باید وارد حساب کاربری شوید. سبد خرید مهمان شما حفظ می‌شود.</p>}
          {itemsNeedingCredentials.length > 0 && <p className="text-[11px] text-brand-zard bg-brand-zard/10 border border-brand-zard/20 p-2.5">{itemsNeedingCredentials.length.toLocaleString("fa-IR")} آیتم نیازمند تکمیل اطلاعات است.</p>}
          {checkoutError && <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-3">{checkoutError}</p>}

          <Button variant="primary" onClick={handleCheckout} disabled={isCheckingOut || isRevalidating} className="w-full py-4 mt-1 disabled:opacity-60">
            {isRevalidating || isCheckingOut ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> {isRevalidating ? "در حال بررسی سبد..." : "در حال ساخت سفارش..."}</span> : isLoggedIn ? "بررسی و ادامه پرداخت" : "ورود و ادامه پرداخت"}
          </Button>
          <div className="text-[10px] leading-5 text-brand-m_khonsa">با ادامه پرداخت، قیمت و موجودی سمت سرور دوباره بررسی می‌شود و مبلغ نهایی از اطلاعات امن فروشگاه محاسبه خواهد شد.</div>
        </div>
      </div>
    </div>
  );
}
