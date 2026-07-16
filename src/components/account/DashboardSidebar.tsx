"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Heart, LifeBuoy, MessageSquare, UserCog, LogOut, ArrowRight, X } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import Skeleton from "@/components/ui/Skeleton";
import { useLogout } from "@/lib/hooks/useLogout";

const NAV_ITEMS = [
  { href: "/my-account", label: "پیشخوان", icon: LayoutDashboard, exact: true },
  { href: "/my-account/orders", label: "سفارش‌های من", icon: Package },
  { href: "/my-account/wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
  { href: "/my-account/reviews", label: "دیدگاه‌های من", icon: MessageSquare },
  { href: "/my-account/tickets", label: "تیکت‌های پشتیبانی", icon: LifeBuoy },
  { href: "/my-account/settings", label: "تنظیمات حساب", icon: UserCog },
];

interface DashboardSidebarProps {
  avatarUrl?: string | null;
  name?: string | null;
  isOpen: boolean;
  isDesktop: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ avatarUrl, name, isOpen, isDesktop, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useLogout();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <aside className="hidden lg:flex flex-col shrink-0 w-[260px] h-screen bg-brand-surface border-l border-brand-surface_hover p-6 gap-3">
        <div className="flex flex-col items-center gap-3 pb-6 mb-3 border-b border-brand-surface_hover">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="w-24 h-4" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-9" />
        ))}
      </aside>
    );
  }

  const containerClasses = isDesktop
    ? `shrink-0 h-screen bg-brand-surface rounded-none border-l border-brand-surface_hover overflow-hidden transition-[width] duration-300 ease-in-out ${
        isOpen ? "w-[260px]" : "w-0"
      }`
    : `fixed top-0 right-0 h-full w-[280px] max-w-[85vw] bg-brand-surface border-l border-brand-surface_hover z-[9999] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`;

  return (
    <aside className={containerClasses} role={!isDesktop ? "dialog" : undefined} aria-modal={!isDesktop ? isOpen : undefined}>
      <div className="flex flex-col h-full w-[260px]">
        <div className="relative flex flex-col items-center rounded-none gap-3 p-6 border-b border-brand-surface_hover shrink-0">
          {!isDesktop && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 left-3 text-brand-m_khonsa hover:text-white transition-colors p-1.5"
              aria-label="بستن منو"
            >
              <X size={18} />
            </button>
          )}
          <UserAvatar src={avatarUrl} name={name} size="lg" ring />
          <span className="text-sm font-bold text-white truncate max-w-full">{name}</span>
          <Link href="/" className="text-xs text-brand-m_khonsa hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowRight size={14} />
            بازگشت به فروشگاه
          </Link>
        </div>

        <nav className="flex flex-col rounded-none flex-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={!isDesktop ? onClose : undefined}
                className={`flex items-center gap-3 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-r-[3px] rounded-none transition-colors ${
                  active ? "border-brand-blue text-white bg-brand-blue/5" : "border-transparent text-brand-m_khonsa hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} strokeWidth={2.25} />
                {label}
              </Link>
            );
          })}

          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-5 rounded-none py-3.5 text-sm font-semibold whitespace-nowrap text-red-500 hover:bg-red-500/10 transition-colors mt-auto shrink-0 border-t border-brand-surface_hover disabled:opacity-50"
          >
            <LogOut size={18} strokeWidth={2.25} />
            {isLoggingOut ? "در حال خروج..." : "خروج از حساب"}
          </button>
        </nav>
      </div>
    </aside>
  );
}