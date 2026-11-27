"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const AdminNotificationsBell = dynamic(() => import("./AdminNotificationsBell"), {
  ssr: false,
  loading: () => <span className="block h-9 w-9 rounded-xl" aria-hidden="true" />,
});

type PageTitle = { href: string; title: string; exact?: boolean };

const PAGE_TITLES: PageTitle[] = [
  { href: "/admin", title: "پیشخوان", exact: true },
  { href: "/admin/orders", title: "مدیریت سفارش‌ها" },
  { href: "/admin/tickets", title: "مرکز پشتیبانی" },
  { href: "/admin/cdkeys", title: "مدیریت CD Keyها" },
  { href: "/admin/reviews", title: "مدیریت دیدگاه‌ها" },
  { href: "/admin/users", title: "مدیریت کاربران" },
  { href: "/admin/products", title: "مدیریت محصولات" },
  { href: "/admin/settings", title: "تنظیمات حساب" },
];

function getPageTitle(pathname: string | null) {
  if (!pathname) return "پنل مدیریت";

  const page = PAGE_TITLES.find((item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return page?.title ?? "پنل مدیریت";
}

export default function AdminHeader({ onToggleNavigation }: { onToggleNavigation: () => void }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-brand-surface/95 px-3 backdrop-blur-xl sm:px-5 lg:px-7">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleNavigation}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-brand-m_khonsa transition-colors hover:border-brand-blue/35 hover:bg-brand-blue/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50"
          aria-label="باز و بسته کردن منوی مدیریت"
        >
          <Menu size={19} strokeWidth={2} />
        </button>

        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-brand-m_khonsa/65 sm:flex">
            <span>ARENA2BATTLE</span>
            <span className="h-1 w-1 rounded-full bg-brand-blue" />
            <span>CONTROL PANEL</span>
          </div>
          <div className="truncate text-sm font-bold text-white sm:mt-1 sm:text-base">{pageTitle}</div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs text-brand-m_khonsa">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0074E1]" />
          <span className="hidden sm:inline">مدیریت فروشگاه</span>
          <span className="sm:hidden">مدیریت</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
          <AdminNotificationsBell />
        </div>
      </div>
    </header>
  );
}
