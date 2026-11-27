"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { AdminContextProvider, useAdminContext } from "./AdminContext";
import type { AdminBootstrap } from "@/lib/admin/server";

export default function AdminShell({
  children,
  initialContext,
}: {
  children: ReactNode;
  initialContext?: AdminBootstrap;
}) {
  return (
    <AdminContextProvider initialContext={initialContext}>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminContextProvider>
  );
}

function AdminShellInner({ children }: { children: ReactNode }) {
  const { user, permissions } = useAdminContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);

  const toggleNavigation = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setIsSidebarCollapsed((current) => !current);
      return;
    }
    setIsMobileSidebarOpen((current) => !current);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileSidebarOpen(false);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileSidebar();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSidebarOpen, closeMobileSidebar]);

  const currentUser = user ?? { name: "مدیر", email: "", avatarUrl: null };

  return (
    <div className="admin-shell flex h-dvh w-full overflow-hidden rounded-none bg-brand-bg text-[14px] leading-6 text-brand-active" dir="rtl">
      {isMobileSidebarOpen ? (
        <button
          type="button"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 cursor-default rounded-none bg-brand-bg/80 lg:hidden"
          aria-label="بستن منوی مدیریت"
        />
      ) : null}
      <AdminSidebar
        user={currentUser}
        permissions={permissions}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />
      <div className="flex h-dvh min-w-0 flex-1 flex-col rounded-none">
        <AdminHeader onToggleNavigation={toggleNavigation} />
        <main className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto rounded-none px-4 py-5 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-[1600px] rounded-none">{children}</div>
        </main>
      </div>
    </div>
  );
}