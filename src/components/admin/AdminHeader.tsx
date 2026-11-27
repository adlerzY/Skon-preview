"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const AdminNotificationsBell = dynamic(() => import("./AdminNotificationsBell"), {
  ssr: false,
  loading: () => <span className="block h-8 w-8" aria-hidden="true" />,
});

type PageTitle = { href: string; title: string; exact?: boolean };

const PAGE_TITLES: PageTitle[] = [
  { href: "/admin", title: "پیشخوان", exact: true },
  { href: "/admin/orders", title: "سفارش‌ها" },
  { href: "/admin/tickets", title: "تیکت‌ها" },
  { href: "/admin/cdkeys", title: "کدهای فعال‌سازی" },
  { href: "/admin/reviews", title: "دیدگاه‌ها" },
  { href: "/admin/users", title: "کاربران" },
  { href: "/admin/products", title: "محصولات" },
  { href: "/admin/settings", title: "تنظیمات حساب" },
];

function getPageTitle(pathname: string | null) {
  if (!pathname) return "پنل مدیریت";
  const page = PAGE_TITLES.find((item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (!page) return "پنل مدیریت";
  if (pathname !== page.href) {
    if (page.href === "/admin/orders") return "جزئیات سفارش";
    if (page.href === "/admin/tickets") return "جزئیات تیکت";
    if (page.href === "/admin/users") return "پرونده کاربر";
    if (page.href === "/admin/products") return "جزئیات محصول";
  }
  return page.title;
}

export default function AdminHeader({ onToggleNavigation }: { onToggleNavigation: () => void }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-[56px] shrink-0 items-center justify-between rounded-none border-b border-brand-surface_hover bg-brand-surface px-3 sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleNavigation}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none text-brand-m_khonsa transition-colors hover:bg-brand-surface_hover hover:text-brand-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
          aria-label="باز و بسته کردن منوی مدیریت"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
        <h1 className="truncate text-sm font-medium text-brand-active">{getPageTitle(pathname)}</h1>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none text-brand-m_khonsa hover:bg-brand-surface_hover hover:text-brand-white">
        <AdminNotificationsBell />
      </div>
    </header>
  );
}
