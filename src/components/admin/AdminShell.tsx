"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { AdminContextProvider, useAdminContext } from "./AdminContext";
import type { AdminBootstrap } from "@/lib/admin/server";

const AdminNotificationsBell = dynamic(() => import("./AdminNotificationsBell"), {
  ssr: false,
  loading: () => <div className="h-8 w-8 rounded-[4px] bg-white/[.025] animate-pulse" aria-hidden="true" />,
});

export default function AdminShell({ children, initialContext }: { children: ReactNode; initialContext?: AdminBootstrap }) {
  return (
    <AdminContextProvider initialContext={initialContext}>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminContextProvider>
  );
}

function AdminShellInner({ children }: { children: ReactNode }) {
  const { user, permissions, loading } = useAdminContext();
  const [isDesktop, setIsDesktop] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const applyMode = (matches: boolean) => {
      setIsDesktop(matches);
      setIsSidebarOpen(matches);
    };
    applyMode(mql.matches);
    const handleChange = (event: MediaQueryListEvent) => applyMode(event.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((current) => !current), []);

  useEffect(() => {
    if (!isDesktop) setIsSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop) return;
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen, isDesktop]);

  const currentUser = user ?? {
    name: loading ? "در حال بارگذاری" : "مدیر",
    email: "",
    avatarUrl: null,
  };

  return (
    <div className="admin-shell h-screen w-full bg-brand-bg flex overflow-hidden text-base" dir="rtl">
      {!isDesktop && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={closeSidebar} aria-hidden="true" />
      )}

      <AdminSidebar user={currentUser} permissions={permissions} isOpen={isSidebarOpen} isDesktop={isDesktop} onClose={closeSidebar} />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <div className="h-16 shrink-0 border-b border-brand-surface_hover flex items-center justify-between px-4 md:px-6 bg-brand-surface">
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" onClick={toggleSidebar} className="text-brand-m_khonsa hover:text-white transition-colors p-2 shrink-0" aria-label="نمایش یا پنهان کردن منو" aria-expanded={isSidebarOpen}>
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-white hidden sm:block">پنل مدیریت</span>
          </div>
          <div className="shrink-0">
            <AdminNotificationsBell />
          </div>
        </div>

        <main className="flex-1 min-h-0 w-full p-4 md:p-6 lg:p-7 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
