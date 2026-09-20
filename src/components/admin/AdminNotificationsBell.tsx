"use client";

import Link from "next/link";
import { Bell, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Notification = {
  databaseId: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function AdminNotificationsBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);

  const load = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const response = await fetch("/api/admin/notifications?unreadOnly=false", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setLoaded(true);
    } catch {
      // اعلان‌ها نباید روی رندر پنل اثر بگذارند.
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    let active = true;
    const loadUnreadCount = async () => {
      try {
        const response = await fetch("/api/admin/notifications?unreadOnly=true", { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setUnreadCount(Array.isArray(data?.notifications) ? data.notifications.length : 0);
      } catch {
        // اعلان‌ها نباید روی رندر پنل اثر بگذارند.
      }
    };
    void loadUnreadCount();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
    const id = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (loaded) setUnreadCount(items.filter((item) => !item.isRead).length);
  }, [items, loaded]);

  const unread = unreadCount;

  const markAll = async () => {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [] }),
    });
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2.5 text-brand-m_khonsa hover:text-white hover:bg-white/5 transition-colors"
        aria-label="اعلان‌ها"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-0 right-0 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-brand-zard text-black text-[9px] font-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="بستن اعلان‌ها" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 w-[min(380px,calc(100vw-24px))] max-h-[min(500px,calc(100dvh-90px))] overflow-hidden bg-brand-surface border border-brand-surface_hover shadow-2xl">
            <div className="flex items-center justify-between gap-3 p-3 border-b border-brand-surface_hover">
              <div className="text-xs font-black text-white">اعلان‌ها</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-[10px] text-brand-blue font-bold">
                  <Check size={12} /> همه خوانده
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-brand-m_khonsa hover:text-white" aria-label="بستن">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {items.slice(0, 20).map((notification) => (
                <div key={notification.databaseId} className={`p-3 border-b border-brand-surface_hover ${notification.isRead ? "" : "bg-brand-blue/5"}`}>
                  {notification.link ? (
                    <Link prefetch={false} href={notification.link} onClick={() => setOpen(false)} className="block">
                      <div className="text-xs font-black text-white">{notification.title}</div>
                      <div className="text-[11px] text-brand-m_khonsa mt-1 leading-5">{notification.body}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="text-xs font-black text-white">{notification.title}</div>
                      <div className="text-[11px] text-brand-m_khonsa mt-1 leading-5">{notification.body}</div>
                    </>
                  )}
                  <div className="text-[10px] text-brand-m_khonsa mt-2" dir="ltr">{new Date(notification.createdAt).toLocaleString("fa-IR")}</div>
                </div>
              ))}
              {items.length === 0 && <div className="p-8 text-center text-xs text-brand-m_khonsa">{loaded ? "اعلانی برای نمایش وجود ندارد." : "در حال دریافت اعلان‌ها…"}</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
