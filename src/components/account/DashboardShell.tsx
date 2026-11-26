"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import UserAvatar from "@/components/ui/UserAvatar";
import NotificationBell from "./NotificationBell";
import MobileBottomNav from "@/components/Header/MobileBottomNav";

interface DashboardShellProps {
  user: { avatarUrl?: string | null; name: string; isStaff?: boolean };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    mql.addEventListener("change", handleChange);
    return () => {
      document.body.style.overflow = "";
      mql.removeEventListener("change", handleChange);
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setDesktopOpen((value) => !value);
    else setMobileOpen((value) => !value);
  }, []);

  const isDashboardRoot = pathname === "/my-account";

  return (
    <div className="h-screen w-full bg-brand-bg flex overflow-hidden" dir="rtl">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <DashboardSidebar
        avatarUrl={user.avatarUrl}
        name={user.name}
        isStaff={user.isStaff}
        desktopOpen={desktopOpen}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <div className="h-[58px] rounded-none shrink-0 border-b border-brand-surface_hover flex items-center justify-between px-3 md:px-6 bg-brand-surface/50">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-brand-m_khonsa hover:text-white transition-colors p-2 shrink-0"
              aria-label="نمایش یا پنهان کردن منو"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar src={user.avatarUrl} name={user.name} size="sm" />
              <span className="text-sm font-bold text-white truncate hidden sm:inline">
                خوش اومدی صفا اوردی {user.name.split(" ")[0]} 👋
              </span>
            </div>
          </div>
          <NotificationBell />
        </div>
        <main
          className={`flex-1 min-h-0 w-full p-4 md:p-6 pb-[calc(58px+env(safe-area-inset-bottom))] lg:pb-6 ${
            isDashboardRoot ? "overflow-y-auto lg:overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div className={isDashboardRoot ? "lg:h-full" : ""}>{children}</div>
        </main>
      </div>

      <MobileBottomNav user={{ name: user.name, avatarUrl: user.avatarUrl }} />
    </div>
  );
}