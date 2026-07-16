"use client";

import { useState, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import OrdersTable from "./OrdersTable";
import FilterTabs from "@/components/ui/FilterTabs";

interface PageInfo { hasNextPage: boolean; endCursor: string | null; }

const STATUS_OPTIONS = [
  { value: "ALL", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "PROCESSING", label: "در حال پردازش" },
  { value: "COMPLETED", label: "تکمیل‌شده" },
  { value: "CANCELLED", label: "لغو‌شده" },
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

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/account/orders?status=${newStatus}`, { cache: "no-store" });
      const data = await res.json();
      setOrders(data.orders ?? []);
      setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pageInfo.endCursor) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/account/orders?status=${status}&after=${encodeURIComponent(pageInfo.endCursor)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setOrders((prev) => [...prev, ...(data.orders ?? [])]);
      setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoading(false);
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