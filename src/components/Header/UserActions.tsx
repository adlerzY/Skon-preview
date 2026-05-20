"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserActions() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const isLoggedIn = false;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-transparent text-brand-m_khonsa">
        <span className="w-8 h-8 rounded-full bg-white/5 border border-[#23252b] shrink-0" />
        <span className="w-16 h-3 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  const prefetchAccount = () => router.prefetch("/my-account");
  const prefetchOrders = () => router.prefetch("/my-account/orders");

  return (
    <div className="relative group">
      <div 
        onMouseEnter={prefetchAccount}
        className="flex items-center gap-2.5 px-3 py-4 cursor-pointer text-brand-m_khonsa text-[14px] font-semibold transition-colors duration-150 hover:bg-brand-surface hover:text-white"
      >
        <span className="flex items-center border border-brand-surface_m justify-center rounded-full w-5 h-5 text-brand-surface_m shrink-0">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </span>
        <span>حساب کاربری</span>
      </div>

      <div className="absolute top-[60px] left-0 bg-[#15171e] border border-white/5 rounded-lg opacity-0 invisible translate-y-1.5 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 p-4 z-[1000] min-w-[260px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] will-change-transform">
        {isLoggedIn ? (
          <>
            <div className="p-2.5 mb-1.5 bg-white/5 rounded-md border border-white/5">
              <div className="text-white font-semibold text-sm">مشتری عزیز</div>
            </div>
            <Link href="/my-account" onMouseEnter={prefetchAccount} className="flex items-center gap-2.5 p-2.5 text-brand-m_khonsa text-[13px] font-semibold transition-colors hover:bg-white/5 hover:text-white rounded">پیشخوان من</Link>
            <Link href="/my-account/orders" onMouseEnter={prefetchOrders} className="flex items-center gap-2.5 p-2.5 text-brand-m_khonsa text-[13px] font-semibold transition-colors hover:bg-white/5 hover:text-white rounded">سفارشات</Link>
            <button className="w-full text-right flex items-center gap-2.5 p-2.5 text-[#ff5c5c] hover:bg-[#ff5c5c]/10 text-[13px] font-semibold transition-colors mt-1 rounded">خروج از حساب</button>
          </>
        ) : (
          <div className="py-2 px-1">
            <div className="text-center mb-3">
              <span className="text-[13px] font-bold text-white block mb-1">وارد شوید</span>
              <span className="text-[12px] text-brand-m_khonsa">برای دسترسی و پیگیری سفارشات وارد شوید.</span>
            </div>
            <Link href="/my-account" onMouseEnter={prefetchAccount} className="block text-center bg-[#0074E1] hover:bg-[#0063c1] text-white py-2 px-4 rounded text-sm font-bold transition-colors">ورود / عضویت</Link>
          </div>
        )}
      </div>
    </div>
  );
}