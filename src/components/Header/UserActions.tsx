"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import UserAvatar from "@/components/ui/UserAvatar";
import { useLogout } from "@/lib/hooks/useLogout";

interface UserActionsProps {
  user: { name: string; avatarUrl?: string | null } | null;
}

export default function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { logout, isLoggingOut } = useLogout();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-4 h-[60px]">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <Skeleton className="w-16 h-4 rounded" />
      </div>
    );
  }

  const isLoggedIn = Boolean(user);
  const prefetchAccount = () => router.prefetch("/my-account");
  const prefetchOrders = () => router.prefetch("/my-account/orders");

  return (
    <div className="relative group/user">
      <Link
        href="/my-account"
        onMouseEnter={prefetchAccount}
        className="flex items-center gap-2.5 px-3 py-4 cursor-pointer text-brand-m_khonsa text-[14px] font-semibold transition-colors duration-150 hover:bg-brand-surface hover:text-white"
      >
        {isLoggedIn ? (
          <UserAvatar src={user!.avatarUrl} name={user!.name} size="sm" />
        ) : (
          <span className="flex items-center border border-brand-surface_m justify-center rounded-full w-5 h-5 text-brand-surface_m shrink-0">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
        )}
        <span>{isLoggedIn ? user!.name.split(" ")[0] : "حساب کاربری"}</span>
      </Link>

      <div className="absolute top-[60px] left-0 bg-[#15171e] border border-white/5 rounded-lg opacity-0 invisible translate-y-1.5 transition-all duration-150 group-hover/user:opacity-100 group-hover/user:visible group-hover/user:translate-y-0 p-4 z-[1000] min-w-[260px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] will-change-transform">
        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-3 p-2.5 mb-1.5 bg-white/5 rounded-md border border-white/5">
              <UserAvatar src={user!.avatarUrl} name={user!.name} size="md" />
              <div className="text-white font-semibold text-sm text-right truncate">{user!.name}</div>
            </div>
            <Link href="/my-account" onMouseEnter={prefetchAccount} className="flex items-center gap-2.5 p-2.5 text-brand-m_khonsa text-[13px] font-semibold transition-colors hover:bg-white/5 hover:text-white rounded text-right w-full">پیشخوان من</Link>
            <Link href="/my-account/orders" onMouseEnter={prefetchOrders} className="flex items-center gap-2.5 p-2.5 text-brand-m_khonsa text-[13px] font-semibold transition-colors hover:bg-white/5 hover:text-white rounded text-right w-full">سفارشات</Link>
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className="w-full text-right flex items-center gap-2.5 p-2.5 text-[#ff5c5c] hover:bg-[#ff5c5c]/10 text-[13px] font-semibold transition-colors mt-1 rounded disabled:opacity-50"
            >
              {isLoggingOut ? "در حال خروج..." : "خروج از حساب"}
            </button>
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