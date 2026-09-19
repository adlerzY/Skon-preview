"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Activity, ClipboardList, FileText, LayoutDashboard, LifeBuoy, LogOut, Package, ShieldCheck, ShoppingCart, UserCog, UserRound, Users, X } from "lucide-react";
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
  anyPermissions?: AdminPermission[];
  exact?: boolean;
};

const PRIMARY_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "پیشخوان", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart, permission: ADMIN_PERMISSIONS.ORDERS_READ },
  { href: "/admin/tickets", label: "تیکت‌ها", icon: LifeBuoy, permission: ADMIN_PERMISSIONS.TICKETS_READ },
  { href: "/admin/customers", label: "مشتریان", icon: Users, permission: ADMIN_PERMISSIONS.USERS_READ },
  { href: "/admin/reviews", label: "دیدگاه‌ها", icon: ClipboardList, permission: ADMIN_PERMISSIONS.REVIEWS_MODERATE },
];

const TOOL_ITEMS: AdminNavItem[] = [
  { href: "/admin/cdkeys", label: "CD Keyها", icon: ShieldCheck, permission: ADMIN_PERMISSIONS.CDKEYS_READ },
  { href: "/admin/gold", label: "تابلوی طلا", icon: Activity, permission: ADMIN_PERMISSIONS.GOLD_READ },
  {
    href: "/admin/engine",
    label: "موتور فروش",
    icon: Package,
    anyPermissions: [ADMIN_PERMISSIONS.PRICING_READ, ADMIN_PERMISSIONS.ENGINE_SCHEDULER, ADMIN_PERMISSIONS.ENGINE_RATES, ADMIN_PERMISSIONS.ENGINE_REVALIDATION],
  },
  { href: "/admin/audit", label: "گزارش رویدادها", icon: FileText, permission: ADMIN_PERMISSIONS.AUDIT_READ },
];

function canSee(item: AdminNavItem, permissions: string[]) {
  if (item.permission) return permissions.includes(item.permission);
  if (item.anyPermissions?.length) return item.anyPermissions.some((permission) => permissions.includes(permission));
  return true;
}

export default function AdminSidebar({ user, permissions, isOpen, isDesktop, onClose }: Props) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useLogout();
  const primaryItems = PRIMARY_ITEMS.filter((item) => canSee(item, permissions));
  const toolItems = TOOL_ITEMS.filter((item) => canSee(item, permissions));
  const toolIsActive = toolItems.some((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
  const [toolsOpen, setToolsOpen] = React.useState(toolIsActive);

  React.useEffect(() => {
    if (toolIsActive) setToolsOpen(true);
  }, [toolIsActive]);

  const containerClasses = isDesktop
    ? `shrink-0 h-screen bg-brand-surface border-l border-brand-surface_hover overflow-hidden transition-[width] duration-200 ease-out ${isOpen ? "w-[220px]" : "w-0"}`
    : `fixed top-0 right-0 h-full w-[260px] max-w-[85vw] bg-brand-surface border-l border-brand-surface_hover z-[9999] transition-transform duration-200 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`;

  return (
    <aside className={containerClasses} role={!isDesktop ? "dialog" : undefined} aria-modal={!isDesktop ? isOpen : undefined}>
      <div className="flex flex-col h-full w-[220px]">
        <div className="relative flex items-center gap-2.5 px-4 py-3 border-b border-brand-surface_hover shrink-0">
          {!isDesktop && (
            <button type="button" onClick={onClose} className="absolute top-3 left-3 text-brand-m_khonsa hover:text-white p-1.5" aria-label="بستن منو">
              <X size={18} />
            </button>
          )}
          <UserAvatar src={user.avatarUrl} name={user.name} size="sm" ring />
          <div className="min-w-0 pr-1">
            <span className="block truncate text-xs font-semibold text-white">{user.name}</span>
          </div>
        </div>

        <nav className="flex flex-col flex-1 overflow-y-auto py-1.5">
          {primaryItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} isDesktop={isDesktop} onClose={onClose} />)}

          {toolItems.length > 0 && (
            <div className="mt-2 border-t border-white/[.04] pt-2">
              <button
                type="button"
                onClick={() => setToolsOpen((current) => !current)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-[11px] font-medium transition-colors ${toolIsActive ? "text-white" : "text-brand-m_khonsa hover:text-white"}`}
                aria-expanded={toolsOpen}
              >
                <span className="flex items-center gap-2"><Package size={15} /> ابزارها</span>
                <ChevronDown size={14} className={`transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsOpen && (
                <div className="space-y-0.5 pb-1">
                  {toolItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} isDesktop={isDesktop} onClose={onClose} compact />)}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto border-t border-brand-surface_hover pt-2">
            <Link href="/admin/settings" prefetch={false} onClick={!isDesktop ? onClose : undefined} className="flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-medium text-brand-m_khonsa hover:text-white hover:bg-white/[.03] transition-colors">
              <UserCog size={17} /> تنظیمات حساب
            </Link>
            <Link href="/my-account" prefetch={false} onClick={!isDesktop ? onClose : undefined} className="flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-medium text-brand-m_khonsa hover:text-white hover:bg-white/[.03] transition-colors">
              <UserRound size={17} /> حساب کاربری
            </Link>
            <button onClick={logout} disabled={isLoggingOut} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[11px] font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
              <LogOut size={17} /> {isLoggingOut ? "در حال خروج..." : "خروج از پنل"}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}

function NavLink({ item, pathname, isDesktop, onClose, compact = false }: { item: AdminNavItem; pathname: string | null; isDesktop: boolean; onClose: () => void; compact?: boolean }) {
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      prefetch={false}
      href={item.href}
      onClick={!isDesktop ? onClose : undefined}
      className={`flex items-center gap-2.5 mx-2 border-r-2 transition-colors ${compact ? "px-2.5 py-2 text-[10px]" : "px-2.5 py-2.5 text-[11px]"} ${active ? "border-brand-blue text-white bg-brand-blue/5" : "border-transparent text-brand-m_khonsa hover:text-white hover:bg-white/[.03]"}`}
    >
      <Icon size={compact ? 16 : 17} strokeWidth={2.25} />
      {item.label}
    </Link>
  );
}
