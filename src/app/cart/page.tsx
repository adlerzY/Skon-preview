"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Button from "@/components/ui/Button"; 
import { Trash2, Globe, Sliders } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart } = useCart();
  const totalOriginalPrice = cart?.reduce((sum: number, item: any) => {
    const regular = Number(item.regularPrice) || Number(item.price) || 0;
    return sum + regular;
  }, 0) || 0;

  const totalPrice = cart?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || 0;
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
        <span>🛒</span> سبد خرید شما ({cart.length.toLocaleString("fa-IR")} مورد)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cart.map((item: any) => {
            const delivery = getDeliveryLabel(item.deliveryMethod);
            return (
              <div
                key={item.id}
                className="bg-brand-surface border border-brand-surface_hover p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4 relative animate-in fade-in duration-200"
              >
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-bold text-base md:text-lg text-brand-active">{item.name}</h3>
                  
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
                      {item.price.toLocaleString("fa-IR")}
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

          <Button
            variant="primary"
            className="w-full py-4 mt-2"
          >
            تکمیل سفارش و پرداخت
          </Button>
        </div>
      </div>
    </div>
  );
}