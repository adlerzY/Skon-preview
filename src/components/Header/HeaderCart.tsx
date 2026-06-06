"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/constants/CartContext";
import Skeleton from "@/components/ui/Skeleton";

export default function HeaderCart() {
  const { cart } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-[55px] h-full flex items-center justify-center">
        <Skeleton className="w-9 h-9 " />
      </div>
    );
  }

  const cartCount = cart.length;

  return (
    <div className="relative h-full group flex items-center z-[100]">
      <Link 
        href="/cart" 
        className="relative text-brand-m_khonsa w-[55px] h-full flex items-center justify-center transition-colors hover:text-white hover:bg-white/5 rounded-[5px]" 
        aria-label="سبد خرید"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {cartCount > 0 && (
          <span className="absolute top-3 right-3 bg-brand-blue text-white text-[11px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-scaleIn">
            {cartCount}
          </span>
        )}
      </Link>
      
      <div className="absolute top-[68px] right-0 bg-brand-menu opacity-0 invisible translate-y-1.5 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 p-4 z-[100] min-w-[300px] border border-brand-surface shadow-xl will-change-transform rounded-b-lg">
        <p className="text-brand-m_khonsa text-right text-sm border-b border-brand-surface_hover pb-2 font-medium">وضعیت سبد خرید</p>
        
        {cartCount === 0 ? (
          <div className="py-8 text-center text-[13px] font-bold text-brand-surface_m">سبد خرید شما خالی است</div>
        ) : (
          <div className="py-3 flex flex-col gap-3">
            {cart.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm gap-2">
                <span className="text-white truncate flex-1 text-right">{item.name}</span>
                <span className="text-brand-sabz font-bold shrink-0" dir="ltr">
                  {item.price.toLocaleString("fa-IR")} <span className="text-xs">تومان</span>
                </span>
              </div>
            ))}
            
            {cartCount > 3 && (
              <div className="text-center text-xs text-brand-m_khonsa pt-2 border-t border-brand-surface_hover">
                و {cartCount - 3} آیتم دیگر...
              </div>
            )}
            
            <Link href="/cart" className="mt-2 w-full bg-brand-blue text-center py-2.5 rounded-lg text-white text-sm font-bold hover:bg-[#0062d1] transition-colors shadow-lg">
              مشاهده و پرداخت
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}