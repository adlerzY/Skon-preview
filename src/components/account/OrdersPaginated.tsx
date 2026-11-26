"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Loader2, Search } from "lucide-react";
import OrdersTable from "./OrdersTable";
import FilterTabs from "@/components/ui/FilterTabs";
import PaymentResultBanner from "./PaymentResultBanner";
import { orderNeedsPolling } from "@/lib/orderStatus";
import { resolvePaymentBanner } from "@/lib/paymentBanner";

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface OrdersResponse {
  orders: any[];
  pageInfo: PageInfo;
  downloadableItems: any[];
}

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

async function requestOrders(status: string, after?: string | null, signal?: AbortSignal): Promise<OrdersResponse> {
  const params = new URLSearchParams({ status });
  if (after) params.set("after", after);
  const res = await fetch(`/api/account/orders?${params.toString()}`, { cache: "no-store", signal });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(data?.error || "orders_request_failed");
  return {
    orders: Array.isArray(data.orders) ? data.orders : [],
    pageInfo: data.pageInfo ?? { hasNextPage: false, endCursor: null },
    downloadableItems: Array.isArray(data.downloadableItems) ? data.downloadableItems : [],
  };
}

export default function OrdersPaginated({
  initialOrders,
  initialPageInfo,
  downloadableItems,
  paymentResult,
  paymentOrderId,
}: {
  initialOrders: any[];
  initialPageInfo: PageInfo;
  downloadableItems: any[];
  paymentResult?: string;
  paymentOrderId?: number;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [downloads, setDownloads] = useState(downloadableItems);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const statusRef = useRef(status);
  const extendedRef = useRef(false);
  const pollCountRef = useRef(0);

  statusRef.current = status;

  useEffect(() => () => abortRef.current?.abort(), []);

  const banner = useMemo(
    () => resolvePaymentBanner(paymentResult, paymentOrderId, orders),
    [paymentResult, paymentOrderId, orders]
  );

  const shouldPoll = useMemo(
    () => Boolean(banner?.polling) || orders.some(orderNeedsPolling),
    [banner, orders]
  );

  const applyFirstPage = useCallback((data: OrdersResponse) => {
    setOrders(data.orders);
    setPageInfo(data.pageInfo);
    setDownloads(data.downloadableItems);
  }, []);

  useEffect(() => {
    if (!shouldPoll) return;
    const timer = window.setInterval(async () => {
      if (extendedRef.current || pollCountRef.current >= MAX_POLLS || document.visibilityState === "hidden") return;
      pollCountRef.current += 1;
      const requested = statusRef.current;
      try {
        const data = await requestOrders(requested);
        if (extendedRef.current || statusRef.current !== requested) return;
        applyFirstPage(data);
      } catch {}
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [shouldPoll, applyFirstPage]);

  const reload = useCallback(async () => {
    extendedRef.current = false;
    pollCountRef.current = 0;
    try {
      applyFirstPage(await requestOrders(statusRef.current));
    } catch {}
  }, [applyFirstPage]);

  const handleStatusChange = async (nextStatus: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    extendedRef.current = false;
    pollCountRef.current = 0;
    setStatus(nextStatus);
    setIsLoading(true);
    setError("");
    try {
      const data = await requestOrders(nextStatus, null, controller.signal);
      if (!controller.signal.aborted) applyFirstPage(data);
    } catch {
      if (!controller.signal.aborted) setError("دریافت سفارش‌ها انجام نشد؛ دوباره تلاش کنید");
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pageInfo.endCursor || isLoading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    extendedRef.current = true;
    setIsLoading(true);
    setError("");
    try {
      const data = await requestOrders(status, pageInfo.endCursor, controller.signal);
      if (!controller.signal.aborted) {
        setOrders((previous) => [...previous, ...data.orders]);
        setPageInfo(data.pageInfo);
      }
    } catch {
      if (!controller.signal.aborted) setError("دریافت سفارش‌های بیشتر انجام نشد؛ دوباره تلاش کنید");
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return orders;
    return orders.filter((order) => String(order.orderNumber || order.databaseId).includes(trimmed));
  }, [orders, search]);

  return (
    <div className="flex flex-col gap-3">
      {banner && <PaymentResultBanner result={banner.result} orderId={paymentOrderId} />}

      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جستجو بر اساس شماره سفارش..."
          className="w-full bg-brand-surface border border-brand-surface_hover pr-9 pl-3 py-2.5 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors"
        />
      </div>

      <FilterTabs options={STATUS_OPTIONS} value={status} onChange={handleStatusChange} />

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3">{error}</p>
      )}

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-brand-m_khonsa gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> در حال بارگذاری...
        </div>
      ) : (
        <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <OrdersTable orders={filteredOrders} downloadableItems={downloads} onOrderChanged={reload} />
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
          بارگذاری سفارش‌های بیشتر
        </button>
      )}
    </div>
  );
}