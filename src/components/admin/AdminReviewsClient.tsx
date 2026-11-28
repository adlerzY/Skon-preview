"use client";

import { useMemo, useState } from "react";
import { Check, EyeOff, Flag, Star } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminFilterBar,
  AdminPage,
  AdminPageIntro,
  AdminRefreshButton,
  AdminSelect,
} from "./AdminUi";
import { AdminErrorBanner, AdminListCount, AdminLoadMore, AdminSkeletonRows } from "./AdminListParts";
import AdminMoreFilters, { AdminFilterField } from "./AdminMoreFilters";
import { useAdminList, type AdminListData } from "./useAdminList";
import { faDate } from "./format";

interface Review {
  databaseId: number;
  content: string;
  rating: number;
  date: string;
  status: string;
  moderationState: string;
  userName: string;
  userEmail: string;
  productId: number;
  productName: string;
}

type ReviewsData = AdminListData<Review>;

const STATES: Record<string, string> = {
  pending: "در انتظار بررسی",
  published: "منتشرشده",
  flagged: "علامت‌گذاری‌شده",
  hidden: "مخفی",
};

const stateTone = (state: string): "neutral" | "success" | "warning" | "danger" =>
  state === "published" ? "success" : state === "flagged" ? "danger" : state === "pending" ? "warning" : "neutral";

export default function AdminReviewsClient({ initial }: { initial?: ReviewsData }) {
  const [state, setState] = useState("pending");
  const [order, setOrder] = useState("desc");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const params = useMemo(() => ({ state, order }), [state, order]);

  const { data, setData, loading, loadingMore, error, refresh, loadMore } = useAdminList<ReviewsData>({
    endpoint: "/api/admin/reviews",
    params,
    initial,
    debounceMs: 0,
  });

  const showSkeleton = loading && data.nodes.length === 0;

  const moderate = async (reviewId: number, moderationAction: "approve" | "hide" | "flag") => {
    setBusyId(reviewId);
    setActionError("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "moderate", reviewId, moderationAction }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.error || "عملیات انجام نشد");
      setData((previous) => ({
        ...previous,
        nodes: previous.nodes.filter((item) => item.databaseId !== reviewId),
      }));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "عملیات انجام نشد");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPage>
      <AdminPageIntro
        title="دیدگاه‌ها"
        description="صف بررسی را کوتاه نگه دار و فقط موارد لازم را بررسی کن."
        action={<AdminRefreshButton onClick={() => void refresh()} loading={loading} />}
      />

      <AdminFilterBar>
        <AdminSelect value={state} onChange={(event) => setState(event.target.value)} className="lg:w-[240px] lg:flex-none">
          <option value="pending">در انتظار بررسی</option>
          <option value="published">منتشرشده</option>
          <option value="flagged">علامت‌گذاری‌شده</option>
          <option value="hidden">مخفی</option>
        </AdminSelect>
        <AdminMoreFilters activeCount={order !== "desc" ? 1 : 0}>
          <AdminFilterField label="مرتب‌سازی">
            <AdminSelect value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="desc">جدیدترین</option>
              <option value="asc">قدیمی‌ترین</option>
            </AdminSelect>
          </AdminFilterField>
        </AdminMoreFilters>
      </AdminFilterBar>

      <AdminErrorBanner message={error || actionError} onRetry={error ? () => void refresh() : undefined} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="موردی در این صف وجود ندارد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />
          <AdminCard className="overflow-hidden">
            {data.nodes.map((review) => {
              const expanded = expandedId === review.databaseId;
              return (
                <div key={review.databaseId} className="border-b border-brand-surface_hover px-4 py-3 last:border-b-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-brand-active">{review.productName || "محصول"}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-brand-m_khonsa">
                        <span>{review.userName || "کاربر"}</span>
                        <span className="inline-flex items-center gap-1 text-brand-zard">
                          <Star size={12} fill="currentColor" />
                          {review.rating.toLocaleString("fa-IR")}/۵
                        </span>
                        <span>{faDate(review.date)}</span>
                      </div>
                    </div>
                    <AdminBadge tone={stateTone(review.moderationState)}>{STATES[review.moderationState] ?? review.moderationState}</AdminBadge>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : review.databaseId)}
                    className="mt-2 block w-full text-right"
                    aria-expanded={expanded}
                  >
                    <p className={`whitespace-pre-wrap text-[14px] leading-7 text-brand-active ${expanded ? "" : "line-clamp-2"}`}>{review.content}</p>
                  </button>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {state !== "published" ? (
                      <AdminButton variant="primary" onClick={() => void moderate(review.databaseId, "approve")} disabled={busyId !== null}>
                        <Check size={14} /> تأیید
                      </AdminButton>
                    ) : null}
                    {state !== "hidden" ? (
                      <AdminButton onClick={() => void moderate(review.databaseId, "hide")} disabled={busyId !== null}>
                        <EyeOff size={14} /> مخفی
                      </AdminButton>
                    ) : null}
                    {state !== "flagged" ? (
                      <AdminButton variant="danger" onClick={() => void moderate(review.databaseId, "flag")} disabled={busyId !== null}>
                        <Flag size={14} /> علامت‌گذاری
                      </AdminButton>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </AdminCard>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />
    </AdminPage>
  );
}