"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import OrdersTable from "./OrdersTable";
import FilterTabs from "@/components/ui/FilterTabs";
import { orderNeedsPolling } from "@/lib/orderStatus";

interface PageInfo { hasNextPage: boolean; endCursor: string | null; }

const POLL_MS = 7000;
const MAX_POLLS = 12;

const STATUS_OPTIONS = [
  { value: "ALL", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "PROCESSING", label: "در حال پردازش" },
  { value: "ON_HOLD", label: "در انتظار بررسی" },
  { value: "COMPLETED", label: "تکمیل‌شده" },
  { value: "CANCELLED", label: "لغو‌شده" },
  { value: "REFUNDED", label: "بازگشت وجه" },
  { value: "FAILED", label: "ناموفق" },
];

export default function OrdersPaginated({
  initialOrders,
  initialPageInfo,
  downloadableItems,
}: {
  initialOrders: any[];
  initialPageInfo: PageInfo;
  downloadableItems: any[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const requestAbortRef = useRef<AbortController | null>(null);
  const statusRef = useRef(status);
  const extendedRef = useRef(false);
  const pollCountRef = useRef(0);

  statusRef.current = status;

  useEffect(() => () => requestAbortRef.current?.abort(), []);

  const shouldPoll = useMemo(() => orders.some(orderNeedsPolling), [orders]);

  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(async () => {
      if (extendedRef.current || pollCountRef.current >= MAX_POLLS || document.visibilityState === "hidden") return;
      pollCountRef.current += 1;
      try {
        const res = await fetch(`/api/account/orders?status=${statusRef.current}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (extendedRef.current) return;
        setOrders(data.orders ?? []);
        setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
      } catch {}
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [shouldPoll]);

  const handleStatusChange = async (newStatus: string) => {
    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;
    extendedRef.current = false;
    pollCountRef.current = 0;
    setStatus(newStatus);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/account/orders?status=${newStatus}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!controller.signal.aborted) {
        setOrders(data.orders ?? []);
        setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pageInfo.endCursor || isLoading) return;
    requestAbortRef.current?.abort();
    const controller = new AbortController();
    requestAbortRef.current = controller;
    extendedRef.current = true;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/account/orders?status=${status}&after=${encodeURIComponent(pageInfo.endCursor)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await res.json();
      if (!controller.signal.aborted) {
        setOrders((prev) => [...prev, ...(data.orders ?? [])]);
        setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return orders;
    return orders.filter((o) => String(o.orderNumber || o.databaseId).includes(trimmed));
  }, [orders, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو بر اساس شماره سفارش..."
          className="w-full bg-brand-surface border border-brand-surface_hover pr-9 pl-3 py-2.5 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
        />
      </div>

      <FilterTabs options={STATUS_OPTIONS} value={status} onChange={handleStatusChange} />

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-brand-m_khonsa gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> در حال بارگذاری...
        </div>
      ) : (
        <OrdersTable orders={filteredOrders} downloadableItems={downloadableItems} />
      )}

      {!search && pageInfo.hasNextPage && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoading}
          className="self-center mt-2 bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          بارگذاری سفارش‌های بیشتر
        </button>
      )}
    </div>
  );
}