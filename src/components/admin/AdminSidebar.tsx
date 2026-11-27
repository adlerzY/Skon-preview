"use client";

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
    label: "فروش و کاتالوگ",
    items: [
      { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart, permission: ADMIN_PERMISSIONS.ORDERS_READ },
      { href: "/admin/products", label: "محصولات", icon: Package, permission: ADMIN_PERMISSIONS.PRODUCTS_READ },
      { href: "/admin/cdkeys", label: "موجودی CD Key", icon: ShieldCheck, permission: ADMIN_PERMISSIONS.CDKEYS_READ },
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
  const sidebarWidth = isCollapsed ? "lg:w-[88px]" : "lg:w-[272px]";
  const mobileState = isMobileOpen
    ? "visible translate-x-0 pointer-events-auto"
    : "invisible translate-x-full pointer-events-none";

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(19rem,88vw)] flex-col border-l border-white/[0.07] bg-[#191C25] shadow-2xl transition-[transform,width] duration-200 ease-out lg:sticky lg:top-0 lg:z-30 lg:h-dvh lg:visible lg:pointer-events-auto lg:translate-x-0 lg:shadow-none ${sidebarWidth} ${mobileState}`}
      aria-label="منوی اصلی مدیریت"
      aria-hidden={!isMobileOpen ? undefined : false}
    >
      <div className={`flex h-[68px] shrink-0 items-center border-b border-white/[0.07] ${compact ? "justify-center px-3" : "justify-between px-5"}`}>
        <Link href="/admin" onClick={onClose} className="flex min-w-0 items-center gap-3" aria-label="Arena2Battle پیشخوان">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0074E1] text-sm font-black tracking-tight text-white shadow-[0_6px_20px_rgba(0,116,225,0.24)]">
            A2B
          </span>
          {!compact ? (
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-extrabold tracking-[0.04em] text-white">ARENA2BATTLE</span>
              <span className="mt-0.5 block text-[10px] font-medium tracking-[0.14em] text-brand-m_khonsa">CONTROL PANEL</span>
            </span>
          ) : null}
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-m_khonsa transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="بستن منو"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="scrollbar-hide flex-1 overflow-y-auto px-3 py-5" aria-label="بخش‌های پنل">
        {groups.map((group, groupIndex) => (
          <section key={group.label} className={groupIndex > 0 ? "mt-6" : ""}>
            {!compact ? (
              <h2 className="mb-2 px-3 text-[10px] font-bold tracking-[0.12em] text-brand-m_khonsa/60">
                {group.label}
              </h2>
            ) : groupIndex > 0 ? (
              <div className="mx-3 mb-3 border-t border-white/[0.07]" />
            ) : null}

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  isCollapsed={compact}
                  onClose={onClose}
                />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div className={`mb-3 flex items-center gap-3 rounded-xl bg-white/[0.035] p-3 ${compact ? "justify-center" : ""}`}>
          <UserAvatar src={user.avatarUrl} name={user.name} size="sm" />
          {!compact ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-white">{user.name || "مدیر"}</div>
              <div className="mt-1 truncate text-[10px] text-brand-m_khonsa" dir="ltr">
                {user.email || "مدیر فروشگاه"}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <SidebarAction
            href="/admin/settings"
            label="تنظیمات حساب"
            icon={Settings2}
            isCollapsed={compact}
            onClick={onClose}
          />
          <SidebarAction
            href="/"
            label="بازگشت به فروشگاه"
            icon={ExternalLink}
            isCollapsed={compact}
            onClick={onClose}
          />
          <button
            type="button"
            onClick={() => {
              onClose();
              void logout();
            }}
            disabled={isLoggingOut}
            title={compact ? "خروج از پنل" : undefined}
            className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "justify-center" : ""}`}
          >
            <LogOut size={17} className="shrink-0" />
            {!compact ? <span>{isLoggingOut ? "در حال خروج..." : "خروج از پنل"}</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
  isCollapsed,
  onClose,
}: {
  item: AdminNavItem;
  pathname: string | null;
  isCollapsed: boolean;
  onClose: () => void;
}) {
  const compact = isCollapsed;
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onClose}
      title={compact ? item.label : undefined}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/55 ${
        compact ? "justify-center" : ""
      } ${
        active
          ? "bg-brand-blue/10 text-white before:absolute before:inset-y-2 before:right-0 before:w-[3px] before:content-[''] before:rounded-l-full before:bg-[#0074E1]"
          : "text-brand-m_khonsa hover:bg-white/[0.045] hover:text-white"
      }`}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2.2 : 1.8}
        className={`shrink-0 ${active ? "text-[#48A2FF]" : "text-brand-m_khonsa/75 group-hover:text-white"}`}
      />
      {!compact ? <span className="truncate">{item.label}</span> : null}
      {active && !compact ? <span className="mr-auto h-1.5 w-1.5 rounded-full bg-[#48A2FF]" /> : null}
    </Link>
  );
}

function SidebarAction({
  href,
  label,
  icon: Icon,
  isCollapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  const compact = isCollapsed;

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      title={compact ? label : undefined}
      aria-label={label}
      className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-brand-m_khonsa transition-colors hover:bg-white/[0.045] hover:text-white ${
        compact ? "justify-center" : ""
      }`}
    >
      <Icon size={17} className="shrink-0" />
      {!isCollapsed ? <span>{label}</span> : null}
    </Link>
  );
}
