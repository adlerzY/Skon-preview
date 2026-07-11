"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Heart, LifeBuoy, UserCog, LogOut, ArrowRight } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";

const NAV_ITEMS = [
  { href: "/my-account", label: "پیشخوان", icon: LayoutDashboard, exact: true },
  { href: "/my-account/orders", label: "سفارش‌های من", icon: Package },
  { href: "/my-account/wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
  { href: "/my-account/tickets", label: "تیکت‌های پشتیبانی", icon: LifeBuoy },
  { href: "/my-account/settings", label: "تنظیمات حساب", icon: UserCog },
];

interface DashboardSidebarProps {
  avatarUrl?: string | null;
  name?: string | null;
}

export default function DashboardSidebar({ avatarUrl, name }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-full lg:w-[260px] shrink-0 bg-brand-surface border-l border-brand-surface_hover flex lg:flex-col">
      <div className="hidden lg:flex flex-col items-center gap-3 p-6 border-b border-brand-surface_hover">
        <UserAvatar src={avatarUrl} name={name} size="lg" ring />
        <span className="text-sm font-bold text-white truncate max-w-full">{name}</span>
        <Link href="/" className="text-xs text-brand-m_khonsa hover:text-white flex items-center gap-1.5 transition-colors">
          <ArrowRight size={14} />
          بازگشت به فروشگاه
        </Link>
      </div>

      <nav className="flex lg:flex-col w-full overflow-x-auto lg:overflow-visible">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-r-2 lg:border-r-[3px] transition-colors ${
                active ? "border-brand-blue text-white bg-brand-blue/5" : "border-transparent text-brand-m_khonsa hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} strokeWidth={2.25} />
              {label}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold whitespace-nowrap text-red-500 hover:bg-red-500/10 transition-colors mt-auto"
        >
          <LogOut size={18} strokeWidth={2.25} />
          خروج از حساب
        </button>
      </nav>
    </aside>
  );
}