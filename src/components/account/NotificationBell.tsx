"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell } from "lucide-react";

interface NotificationItem { id: string; title: string; body: string; isRead: boolean; }

const POLL_INTERVAL_MS = 45_000;

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unreadCount = items.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/account/notifications", { cache: "no-store" });
      const data = await res.json();
      setItems(data?.notifications ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();

    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
      } else {
        fetchNotifications();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  const handleOpen = async () => {
    setIsOpen((p) => !p);
    if (unreadCount > 0) {
      await fetch("/api/account/notifications/mark-read", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative text-brand-m_khonsa hover:text-white transition-colors p-2" aria-label="اعلان‌ها">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] w-[320px] bg-brand-menu border border-white/10 shadow-2xl z-50 max-h-[400px] overflow-y-auto">
          <div className="p-3 border-b border-white/5 text-xs font-bold text-brand-m_khonsa">اعلان‌ها</div>
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-brand-m_khonsa">اعلانی وجود ندارد</div>
          ) : items.map((n) => (
            <div key={n.id} className={`p-3 border-b border-white/5 ${!n.isRead ? "bg-brand-blue/5" : ""}`}>
              <p className="text-xs font-bold text-white mb-1">{n.title}</p>
              <p className="text-[11px] text-brand-m_khonsa leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}