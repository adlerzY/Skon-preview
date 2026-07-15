"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface TicketNode {
  id: string;
  databaseId: number;
  title: string;
  date?: string;
  ticketStatus?: string;
  linkedOrderId?: number | null;
  customerName?: string | null;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

const STATUS_TONE: Record<string, "blue" | "sabz" | "zard" | "red" | "neutral"> = {
  open: "zard",
  answered: "blue",
  closed: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  open: "باز",
  answered: "پاسخ داده‌شده",
  closed: "بسته‌شده",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "همه وضعیت‌ها" },
  { value: "open", label: "باز" },
  { value: "answered", label: "پاسخ داده‌شده" },
  { value: "closed", label: "بسته‌شده" },
];

export default function TicketsPaginated({
  initialTickets,
  initialPageInfo,
}: {
  initialTickets: TicketNode[];
  initialPageInfo: PageInfo;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  const fetchTickets = async (nextSearch: string, nextStatus: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      if (nextStatus !== "ALL") params.set("status", nextStatus);
      const res = await fetch(`/api/account/tickets?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTickets(search, statusFilter);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, statusFilter]);

  const handleLoadMore = async () => {
    if (!pageInfo.endCursor) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("after", pageInfo.endCursor);
      const res = await fetch(`/api/account/tickets?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setTickets((prev) => [...prev, ...(data.tickets ?? [])]);
      setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در عنوان تیکت..."
            className="w-full bg-brand-surface border border-brand-surface_hover pr-9 pl-3 py-2.5 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-brand-surface border border-brand-surface_hover px-3 py-2.5 text-sm text-brand-active focus:outline-none focus:border-brand-blue"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && tickets.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-brand-m_khonsa gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> در حال بارگذاری...
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-10 text-center text-brand-m_khonsa">تیکتی با این مشخصات یافت نشد.</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => {
            const status = ticket.ticketStatus ?? "open";
            return (
              <Link key={ticket.id} href={`/my-account/tickets/${ticket.databaseId}`}>
                <Card className="p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-brand-surface_hover transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-white text-sm">{ticket.title}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {ticket.date && (
                        <span className="text-xs text-brand-m_khonsa">
                          {new Date(ticket.date).toLocaleDateString("fa-IR")}
                        </span>
                      )}
                      {ticket.customerName && (
                        <span className="text-[11px] text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-2 py-0.5 rounded">
                          {ticket.customerName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ticket.linkedOrderId && (
                      <span className="text-xs text-brand-m_khonsa">سفارش #{ticket.linkedOrderId}</span>
                    )}
                    <Badge tone={STATUS_TONE[status] ?? "neutral"}>
                      {STATUS_LABEL[status] ?? status}
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {pageInfo.hasNextPage && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoading}
          className="self-center mt-2 bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          بارگذاری تیکت‌های بیشتر
        </button>
      )}
    </div>
  );
}