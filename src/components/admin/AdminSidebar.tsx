"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ClipboardList, LayoutDashboard, LifeBuoy, LogOut, UserCog, ShieldCheck, ShoppingCart, X } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";
import { useLogout } from "@/lib/hooks/useLogout";

type Props = {
  user: { name: string; email: string; avatarUrl: string | null };
  permissions: string[];
  isOpen: boolean;
  isDesktop: boolean;
  onClose: () => void;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: AdminPermission;
  exact?: boolean;
};

const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "پیشخوان", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart, permission: ADMIN_PERMISSIONS.ORDERS_READ },
  { href: "/admin/tickets", label: "تیکت‌ها", icon: LifeBuoy, permission: ADMIN_PERMISSIONS.TICKETS_READ },
  { href: "/admin/cdkeys", label: "CD Keyها", icon: ShieldCheck, permission: ADMIN_PERMISSIONS.CDKEYS_READ },
  { href: "/admin/reviews", label: "دیدگاه‌ها", icon: ClipboardList, permission: ADMIN_PERMISSIONS.REVIEWS_MODERATE },
];

function canSee(item: AdminNavItem, permissions: string[]) {
  return !item.permission || permissions.includes(item.permission);
}

export default function AdminSidebar({ user, permissions, isOpen, isDesktop, onClose }: Props) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useLogout();
  const items = NAV_ITEMS.filter((item) => canSee(item, permissions));

  const containerClasses = isDesktop
    ? `shrink-0 h-screen bg-brand-surface border-l border-brand-surface_hover overflow-hidden transition-[width] duration-200 ease-out ${isOpen ? "w-[260px]" : "w-0"}`
    : `fixed top-0 right-0 h-full w-[280px] max-w-[88vw] bg-brand-surface border-l border-brand-surface_hover z-[9999] transition-transform duration-200 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`;

  return (
    <aside className={containerClasses} role={!isDesktop ? "dialog" : undefined} aria-modal={!isDesktop ? isOpen : undefined}>
      <div className="flex flex-col h-full w-[260px]">
        <div className="relative flex items-center gap-3 px-5 py-4 border-b border-brand-surface_hover shrink-0">
          {!isDesktop && (
            <button type="button" onClick={onClose} className="absolute top-3 left-3 text-brand-m_khonsa hover:text-white p-1.5" aria-label="بستن منو">
              <X size={18} />
            </button>
          )}
          <UserAvatar src={user.avatarUrl} name={user.name} size="md" ring />
          <div className="min-w-0 pr-1">
            <span className="block truncate text-base font-semibold text-white">{user.name}</span>
          </div>
        </div>

        <nav className="flex flex-col flex-1 overflow-y-auto py-2">
          {items.map((item) => <NavLink key={item.href} item={item} pathname={pathname} isDesktop={isDesktop} onClose={onClose} />)}

          <div className="mt-auto border-t border-brand-surface_hover pt-2">
            <Link href="/admin/settings" prefetch={false} onClick={!isDesktop ? onClose : undefined} className="flex items-center gap-2.5 px-4 py-3 text-[15px] font-medium text-brand-m_khonsa hover:text-white hover:bg-white/[.03] transition-colors">
              <UserCog size={17} /> تنظیمات حساب
            </Link>
            <Link href="/" prefetch={false} onClick={!isDesktop ? onClose : undefined} className="flex items-center gap-2.5 px-4 py-3 text-[15px] font-medium text-brand-m_khonsa hover:text-white hover:bg-white/[.03] transition-colors">
              <ArrowRight size={18} /> بازگشت به فروشگاه
            </Link>
            <button onClick={logout} disabled={isLoggingOut} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
              <LogOut size={17} /> {isLoggingOut ? "در حال خروج..." : "خروج از پنل"}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}

function NavLink({ item, pathname, isDesktop, onClose }: { item: AdminNavItem; pathname: string | null; isDesktop: boolean; onClose: () => void }) {
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      prefetch={false}
      href={item.href}
      onClick={!isDesktop ? onClose : undefined}
      className={`flex items-center gap-3 mx-2 border-r-2 px-3 py-3 text-[15px] transition-colors ${active ? "border-brand-blue text-white bg-brand-blue/5" : "border-transparent text-brand-m_khonsa hover:text-white hover:bg-white/[.03]"}`}
    >
      <Icon size={19} strokeWidth={2.25} />
      {item.label}
    </Link>
  );
}
