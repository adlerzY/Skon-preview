"use client";

import Link from "next/link";
import { Bell, Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Notification = {
  databaseId: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const COUNT_POLL_MS = 60_000;
const LIST_POLL_MS = 30_000;

export default function AdminNotificationsBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);

  const loadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications?countOnly=1", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) return;
      const json = await response.json();
      setUnreadCount(Number(json?.count ?? 0));
    } catch {}
  }, []);

  const loadList = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) return;
      const json = await response.json();
      const list: Notification[] = Array.isArray(json.notifications) ? json.notifications : [];
      setItems(list);
      setLoaded(true);
      setUnreadCount((current) => Math.max(list.filter((item) => !item.isRead).length, list.length < 20 ? 0 : current));
    } catch {
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadCount();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadCount();
    }, COUNT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadCount]);

  useEffect(() => {
    if (!open) return;
    void loadList();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadList();
    }, LIST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [open, loadList]);

  const markAll = async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [] }),
      });
      if (!response.ok) return;
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2.5 text-brand-m_khonsa transition-colors hover:bg-white/5 hover:text-white"
        aria-label="اعلان‌ها"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-zard px-1 text-[9px] font-black text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="بستن اعلان‌ها" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 max-h-[min(500px,calc(100dvh-90px))] w-[min(380px,calc(100vw-24px))] overflow-hidden border border-brand-surface_hover bg-brand-surface shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-brand-surface_hover p-3">
              <div className="text-sm font-black text-white">اعلان‌ها</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void markAll()} className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue">
                  <Check size={12} /> همه خوانده
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-brand-m_khonsa hover:text-white" aria-label="بستن">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {items.map((notification) => (
                <div
                  key={notification.databaseId}
                  className={`border-b border-brand-surface_hover p-3 ${notification.isRead ? "" : "bg-brand-blue/5"}`}
                >
                  {notification.link ? (
                    <Link prefetch={false} href={notification.link} onClick={() => setOpen(false)} className="block">
                      <div className="text-sm font-black text-white">{notification.title}</div>
                      <div className="mt-1 text-xs leading-5 text-brand-m_khonsa">{notification.body}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="text-sm font-black text-white">{notification.title}</div>
                      <div className="mt-1 text-xs leading-5 text-brand-m_khonsa">{notification.body}</div>
                    </>
                  )}
                  <div className="mt-2 text-xs text-brand-m_khonsa" dir="ltr">
                    {new Date(notification.createdAt).toLocaleString("fa-IR")}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="p-8 text-center text-sm text-brand-m_khonsa">
                  {loaded ? "اعلانی برای نمایش وجود ندارد." : "در حال دریافت اعلان‌ها…"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}