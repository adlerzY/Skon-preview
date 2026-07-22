"use client";

import { useEffect, useState, useCallback } from "react";
import { Newspaper } from "lucide-react";

interface NotificationItem { id: string; title: string; body: string; link?: string; isRead: boolean; type?: string; }

export default function BlogNotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = items.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/account/notifications", { cache: "no-store" });
      const data = await res.json();
      setItems((data?.notifications ?? []).filter((n: NotificationItem) => n.type === "blog"));
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpen = async () => {
    setIsOpen((p) => !p);
    if (unreadCount > 0) {
      await fetch("/api/account/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blog" }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative text-brand-m_khonsa hover:text-white transition-colors p-2" aria-label="اعلان‌های وبلاگ">
        <Newspaper size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-brand-blue text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] w-[300px] bg-brand-menu border border-white/10 shadow-2xl z-50 max-h-[380px] overflow-y-auto rounded-lg">
          <div className="p-3 border-b border-white/5 text-xs font-bold text-brand-m_khonsa">اعلان‌های وبلاگ</div>
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-brand-m_khonsa">خبر جدیدی نیست</div>
          ) : (
            items.map((n) => (
              <a key={n.id} href={n.link || "#"} className={`block p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.isRead ? "bg-brand-blue/5" : ""}`}>
                <p className="text-xs font-bold text-white mb-1">{n.title}</p>
                <p className="text-[11px] text-brand-m_khonsa leading-relaxed">{n.body}</p>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}