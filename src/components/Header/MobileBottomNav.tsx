// src/components/Header/MobileBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Newspaper, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useActiveRegion } from "@/lib/hooks/useActiveRegion";
import UserAvatar from "@/components/ui/UserAvatar";

interface MobileBottomNavProps {
  user: { name: string; avatarUrl?: string | null } | null;
  loading?: boolean;
}

export default function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { totalQuantity } = useCart();
  const { region } = useActiveRegion();

  const isCartActive = pathname === "/cart";
  const isAccountActive = pathname?.startsWith("/my-account") ?? false;
  const isBlogActive = pathname ? /\/blog(\/|$)/.test(pathname) : false;
  const isShopActive = !isCartActive && !isAccountActive && !isBlogActive;

  return (
    <nav
      dir="rtl"
      aria-label="ناوبری پایین صفحه"
      className="lg:hidden fixed bottom-0 inset-x-0 z-[9997] bg-[#15171e] border-t border-white/5"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4 items-stretch h-[58px]">
        <Link
          prefetch={false}
          href="/my-account"
          className="flex flex-col items-center justify-center gap-1"
          aria-label="حساب کاربری"
          aria-current={isAccountActive ? "page" : undefined}
        >
          {user ? (
            <UserAvatar src={user.avatarUrl} name={user.name} size="xs" ring={isAccountActive} />
          ) : (
            <User size={20} strokeWidth={2.5} className={isAccountActive ? "text-brand-blue" : "text-brand-m_khonsa"} />
          )}
          <span className={`text-[10px] font-bold ${isAccountActive ? "text-brand-blue" : "text-brand-m_khonsa"}`}>
            حساب من
          </span>
        </Link>

        <Link
          prefetch={false}
          href={`/${region}/blog`}
          className="flex flex-col items-center justify-center gap-1"
          aria-label="بلاگ"
          aria-current={isBlogActive ? "page" : undefined}
        >
          <Newspaper size={20} strokeWidth={2.5} className={isBlogActive ? "text-brand-blue" : "text-brand-m_khonsa"} />
          <span className={`text-[10px] font-bold ${isBlogActive ? "text-brand-blue" : "text-brand-m_khonsa"}`}>
            بلاگ
          </span>
        </Link>

        <Link
          prefetch={false}
          href={`/${region}`}
          className="flex flex-col items-center justify-center gap-1"
          aria-label="فروشگاه"
          aria-current={isShopActive ? "page" : undefined}
        >
          <Store size={20} strokeWidth={2.5} className={isShopActive ? "text-brand-blue" : "text-brand-m_khonsa"} />
          <span className={`text-[10px] font-bold ${isShopActive ? "text-brand-blue" : "text-brand-m_khonsa"}`}>
            فروشگاه
          </span>
        </Link>

        <Link
          prefetch={false}
          href="/cart"
          className="flex flex-col items-center justify-center gap-1"
          aria-label={`سبد خرید — ${totalQuantity} آیتم`}
          aria-current={isCartActive ? "page" : undefined}
        >
          <span className="relative">
            <ShoppingCart size={20} strokeWidth={2.5} className={isCartActive ? "text-brand-blue" : "text-brand-m_khonsa"} />
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-blue text-white text-[9px] font-bold min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center">
                {totalQuantity > 9 ? "9+" : totalQuantity.toLocaleString("fa-IR")}
              </span>
            )}
          </span>
          <span className={`text-[10px] font-bold ${isCartActive ? "text-brand-blue" : "text-brand-m_khonsa"}`}>
            سبد خرید
          </span>
        </Link>
      </div>
    </nav>
  );
}