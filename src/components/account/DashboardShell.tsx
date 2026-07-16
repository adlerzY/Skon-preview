"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import UserAvatar from "@/components/ui/UserAvatar";
import NotificationBell from "./NotificationBell";

interface DashboardShellProps {
  user: { avatarUrl?: string | null; name: string };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");

    const applyMode = (matches: boolean) => {
      setIsDesktop(matches);
      setIsSidebarOpen(matches);
    };

    applyMode(mql.matches);

    const handleChange = (e: MediaQueryListEvent) => applyMode(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isDesktop) setIsSidebarOpen(false);
  }, [pathname, isDesktop]);

  useEffect(() => {
    if (isDesktop) return;
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen, isDesktop]);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  const isDashboardRoot = pathname === "/my-account";
  const isFixedDashboard = isDesktop && isDashboardRoot;

  return (
    <div className="h-screen w-full bg-brand-bg flex overflow-hidden" dir="rtl">
      {!isDesktop && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <DashboardSidebar
        avatarUrl={user.avatarUrl}
        name={user.name}
        isOpen={isSidebarOpen}
        isDesktop={isDesktop}
        onClose={closeSidebar}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <div className="h-[58px] rounded-none shrink-0 border-b border-brand-surface_hover flex items-center justify-between px-3 md:px-6 bg-brand-surface/50">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-brand-m_khonsa hover:text-white transition-colors p-2 shrink-0"
              aria-label="نمایش یا پنهان کردن منو"
              aria-expanded={isSidebarOpen}
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
        <main className={`flex-1 min-h-0 w-full p-4 md:p-6 ${isFixedDashboard ? "overflow-hidden" : "overflow-y-auto"}`}>
          <div className={isFixedDashboard ? "h-full" : ""}>{children}</div>
        </main>
      </div>
    </div>
  );
}