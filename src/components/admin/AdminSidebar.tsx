"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";
import { useLogout } from "@/lib/hooks/useLogout";

type AdminUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

type Props = {
  user: AdminUser;
  permissions: string[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: AdminPermission;
  exact?: boolean;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "نمای کلی",
    items: [{ href: "/admin", label: "پیشخوان", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "فروشگاه",
    items: [
      { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart, permission: ADMIN_PERMISSIONS.ORDERS_READ },
      { href: "/admin/products", label: "محصولات", icon: Package, permission: ADMIN_PERMISSIONS.PRODUCTS_READ },
      { href: "/admin/cdkeys", label: "کدهای فعال‌سازی", icon: ShieldCheck, permission: ADMIN_PERMISSIONS.CDKEYS_READ },
    ],
  },
  {
    label: "مشتریان و پشتیبانی",
    items: [
      { href: "/admin/users", label: "کاربران", icon: Users, permission: ADMIN_PERMISSIONS.USERS_READ },
      { href: "/admin/tickets", label: "تیکت‌ها", icon: LifeBuoy, permission: ADMIN_PERMISSIONS.TICKETS_READ },
      { href: "/admin/reviews", label: "دیدگاه‌ها", icon: ClipboardList, permission: ADMIN_PERMISSIONS.REVIEWS_MODERATE },
    ],
  },
];

function canSee(item: AdminNavItem, permissions: string[]) {
  return !item.permission || permissions.includes(item.permission);
}

export default function AdminSidebar({ user, permissions, isCollapsed, isMobileOpen, onClose }: Props) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useLogout();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item, permissions)),
  })).filter((group) => group.items.length > 0);
  const compact = isCollapsed && !isMobileOpen;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(18rem,88vw)] flex-col rounded-none border-l border-brand-surface_hover bg-brand-menu transition-[transform,width] duration-150 ease-out lg:sticky lg:top-0 lg:z-30 lg:visible lg:pointer-events-auto lg:translate-x-0 ${isCollapsed ? "lg:w-[76px]" : "lg:w-[256px]"} ${isMobileOpen ? "visible translate-x-0 pointer-events-auto" : "invisible translate-x-full pointer-events-none"}`}
      aria-label="منوی مدیریت"
    >
      <div className={`flex h-[60px] shrink-0 items-center rounded-none border-b border-brand-surface_hover ${compact ? "justify-center px-2" : "justify-between px-4"}`}>
        <Link href="/admin" onClick={onClose} className="flex min-w-0 items-center rounded-none" aria-label="پیشخوان آرنا۲بتل">
          <Image
            src="/images/arena2battleLogo.webp"
            alt="آرنا۲بتل"
            width={128}
            height={48}
            priority
            className={compact ? "h-8 w-[54px] rounded-none object-contain" : "h-9 w-[116px] rounded-none object-contain object-right"}
          />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-none text-brand-m_khonsa hover:bg-brand-surface hover:text-brand-white lg:hidden"
          aria-label="بستن منو"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto rounded-none px-2 py-4" aria-label="بخش‌های پنل">
        {groups.map((group, groupIndex) => (
          <section key={group.label} className={groupIndex > 0 ? "mt-5" : ""}>
            {!compact ? <h2 className="mb-1.5 px-3 text-[12px] font-medium text-brand-surface_m">{group.label}</h2> : null}
            {compact && groupIndex > 0 ? <div className="mx-2 mb-2 border-t border-brand-surface_hover" /> : null}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} compact={compact} onClose={onClose} />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="shrink-0 rounded-none border-t border-brand-surface_hover px-2 py-3">
        <div className={`mb-2 flex min-h-11 items-center gap-3 px-2 ${compact ? "justify-center" : ""}`}>
          <UserAvatar src={user.avatarUrl} name={user.name} size="sm" />
          {!compact ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-brand-active">{user.name || "مدیر"}</div>
              <div className="mt-0.5 truncate text-[12px] text-brand-surface_m">مدیریت فروشگاه</div>
            </div>
          ) : null}
        </div>
        <div className="space-y-0.5">
          <SidebarAction href="/admin/settings" label="تنظیمات حساب" icon={Settings2} compact={compact} onClick={onClose} />
          <SidebarAction href="/" label="بازگشت به فروشگاه" icon={ExternalLink} compact={compact} onClick={onClose} />
          <button
            type="button"
            onClick={() => {
              onClose();
              void logout();
            }}
            disabled={isLoggingOut}
            title={compact ? "خروج از پنل" : undefined}
            className={`flex min-h-10 w-full items-center gap-3 rounded-none px-3 text-[14px] text-brand-m_khonsa transition-colors hover:bg-brand-surface hover:text-brand-zard disabled:opacity-50 ${compact ? "justify-center" : ""}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!compact ? <span>{isLoggingOut ? "در حال خروج…" : "خروج از پنل"}</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
  compact,
  onClose,
}: {
  item: AdminNavItem;
  pathname: string | null;
  compact: boolean;
  onClose: () => void;
}) {
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onClose}
      title={compact ? item.label : undefined}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-10 items-center gap-3 rounded-none px-3 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue ${compact ? "justify-center" : ""} ${active ? "border-r-2 border-brand-blue bg-brand-surface text-brand-white" : "border-r-2 border-transparent text-brand-m_khonsa hover:bg-brand-surface hover:text-brand-white"}`}
    >
      <Icon size={18} strokeWidth={1.8} className={`shrink-0 ${active ? "text-brand-blue" : "text-brand-surface_m"}`} />
      {!compact ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function SidebarAction({
  href,
  label,
  icon: Icon,
  compact,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  compact: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      title={compact ? label : undefined}
      aria-label={label}
      className={`flex min-h-10 items-center gap-3 rounded-none px-3 text-[14px] text-brand-m_khonsa transition-colors hover:bg-brand-surface hover:text-brand-white ${compact ? "justify-center" : ""}`}
    >
      <Icon size={18} className="shrink-0" />
      {!compact ? <span>{label}</span> : null}
    </Link>
  );
}