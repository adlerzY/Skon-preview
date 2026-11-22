"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Bell, Newspaper, Package, LifeBuoy, MessageSquare } from "lucide-react";

interface NotificationItem { id: string; title: string; body: string; link?: string; isRead: boolean; type?: string; }

const POLL_INTERVAL_MS = 45_000;

const TYPE_ICON: Record<string, React.ElementType> = {
  blog: Newspaper,
  order: Package,
  ticket: LifeBuoy,
  support: LifeBuoy,
  review: MessageSquare,
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const unreadCount = items.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/account/notifications", { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!controller.signal.aborted) setItems(data?.notifications ?? []);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) return;
    }
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
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);

    if (!next) {
      setHighlighted(new Set());
      return;
    }

    if (unreadCount > 0) {
      setHighlighted(new Set(items.filter((n) => !n.isRead).map((n) => n.id)));
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      void fetch("/api/account/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={handleToggle} className="relative text-brand-m_khonsa hover:text-white transition-colors p-2" aria-label="اعلان‌ها" aria-expanded={isOpen}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] w-[320px] max-w-[calc(100vw-24px)] bg-brand-menu border border-white/10 shadow-2xl z-50 max-h-[400px] overflow-y-auto">
          <div className="p-3 border-b border-white/5 text-xs font-bold text-brand-m_khonsa">اعلان‌ها</div>
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-brand-m_khonsa">اعلانی وجود ندارد</div>
          ) : items.map((n) => {
            const Icon = TYPE_ICON[n.type ?? ""] ?? Bell;
            return (
              <Link
                key={n.id}
                href={n.link || "#"}
                prefetch={false}
                onClick={() => setIsOpen(false)}
                className={`flex items-start gap-2.5 p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${highlighted.has(n.id) ? "bg-brand-blue/5" : ""}`}
              >
                <Icon size={14} className="text-brand-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white mb-1">{n.title}</p>
                  <p className="text-[11px] text-brand-m_khonsa leading-relaxed">{n.body}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}