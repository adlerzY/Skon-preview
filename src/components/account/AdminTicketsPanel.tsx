"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Clock, RefreshCw } from "lucide-react";

const POLL_INTERVAL_MS = 2 * 60 * 1000;

interface AdminTicketItem {
  id: string;
  databaseId: number;
  title: string;
  date?: string;
  linkedOrderId?: number | null;
  customerName?: string | null;
}

export default function AdminTicketsPanel({ initialTickets }: { initialTickets: AdminTicketItem[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/tickets", { cache: "no-store" });
      const data = await res.json();
      setTickets(data?.tickets ?? []);
    } catch {
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchTickets, POLL_INTERVAL_MS);
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
        fetchTickets();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchTickets]);

  return (
    <div className="bg-brand-surface border border-brand-surface_hover p-5 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 border-b border-brand-surface_hover pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">تیکت‌های بدون پاسخ</span>
          {isRefreshing && <RefreshCw size={12} className="text-brand-m_khonsa animate-spin" />}
        </div>
        <Link href="/my-account/tickets" className="text-xs text-brand-blue hover:text-white transition-colors font-bold">
          مشاهده همه
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-xs text-brand-m_khonsa py-8">
          تیکت باز و بی‌پاسخی وجود ندارد 🎉
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {tickets.map((ticket, index) => (
            <Link
              key={ticket.id}
              href={`/my-account/tickets/${ticket.databaseId}`}
              className="flex items-center justify-between gap-3 py-3 border-b border-brand-surface_hover last:border-0 hover:bg-white/5 transition-colors px-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-brand-zard/10 text-brand-zard text-[10px] font-bold flex items-center justify-center shrink-0">
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-bold text-white truncate">{ticket.title}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ticket.customerName && (
                      <span className="text-[11px] text-brand-blue">{ticket.customerName}</span>
                    )}
                    {ticket.linkedOrderId && (
                      <span className="text-[11px] text-brand-m_khonsa">سفارش #{ticket.linkedOrderId}</span>
                    )}
                  </div>
                </div>
              </div>
              {ticket.date && (
                <span className="flex items-center gap-1 text-[11px] text-brand-m_khonsa shrink-0">
                  <Clock size={11} />
                  {new Date(ticket.date).toLocaleDateString("fa-IR")}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}