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
    <div className="relative rounded-none">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-none text-brand-m_khonsa transition-colors hover:bg-brand-surface_hover hover:text-brand-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
        aria-label="اعلان‌ها"
        aria-expanded={open}
      >
        <Bell size={19} />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-zard px-1 text-[10px] font-semibold text-brand-bg">
            {unreadCount > 9 ? "۹+" : unreadCount.toLocaleString("fa-IR")}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default rounded-none" aria-label="بستن اعلان‌ها" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 max-h-[min(480px,calc(100dvh-80px))] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-[5px] border border-brand-surface_hover bg-brand-surface">
            <div className="flex items-center justify-between gap-3 border-b border-brand-surface_hover px-4 py-3">
              <div className="text-[14px] font-semibold text-brand-active">اعلان‌ها</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void markAll()} className="inline-flex items-center gap-1 text-[12px] text-brand-blue hover:text-brand-active">
                  <Check size={13} /> خواندن همه
                </button>
                <button type="button" onClick={() => setOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-none text-brand-m_khonsa hover:bg-brand-surface_hover hover:text-brand-white" aria-label="بستن">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="max-h-[410px] overflow-y-auto">
              {items.map((notification) => (
                <div key={notification.databaseId} className={`border-b border-brand-surface_hover px-4 py-3 ${notification.isRead ? "" : "bg-brand-blue/5"}`}>
                  {notification.link ? (
                    <Link prefetch={false} href={notification.link} onClick={() => setOpen(false)} className="block rounded-none">
                      <div className="text-[13px] font-medium text-brand-active">{notification.title}</div>
                      <div className="mt-1 text-[12px] leading-5 text-brand-m_khonsa">{notification.body}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="text-[13px] font-medium text-brand-active">{notification.title}</div>
                      <div className="mt-1 text-[12px] leading-5 text-brand-m_khonsa">{notification.body}</div>
                    </>
                  )}
                  <div className="mt-1.5 text-[11px] text-brand-surface_m" dir="ltr">{new Date(notification.createdAt).toLocaleString("fa-IR")}</div>
                </div>
              ))}
              {items.length === 0 ? <div className="px-4 py-8 text-center text-[13px] text-brand-m_khonsa">{loaded ? "اعلانی برای نمایش وجود ندارد." : "در حال دریافت اعلان‌ها…"}</div> : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}