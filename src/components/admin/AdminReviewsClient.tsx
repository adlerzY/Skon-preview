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
import { useAdminList, type AdminListData } from "./useAdminList";

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

export default function AdminReviewsClient({ initial }: { initial?: ReviewsData }) {
  const [state, setState] = useState("pending");
    const [order, setOrder] = useState("desc");
  const [busyId, setBusyId] = useState<number | null>(null);
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
        eyebrow="عملیات"
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
                <AdminSelect value={order} onChange={(event) => setOrder(event.target.value)} className="lg:w-[200px] lg:flex-none">
          <option value="desc">جدیدترین</option>
          <option value="asc">قدیمی‌ترین</option>
        </AdminSelect>
      </AdminFilterBar>

      <AdminErrorBanner message={error || actionError} onRetry={error ? () => void refresh() : undefined} />

      {showSkeleton ? (
        <AdminSkeletonRows />
      ) : data.nodes.length === 0 && !error ? (
        <AdminEmpty title="موردی در این صف وجود ندارد." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminListCount count={data.nodes.length} hasMore={data.pageInfo.hasNextPage} />
          <div className="grid gap-3">
            {data.nodes.map((review) => (
              <AdminCard key={review.databaseId} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">{review.productName || "محصول"}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-m_khonsa">
                      <span>{review.userName || "کاربر"}</span>
                      <span>#{review.databaseId}</span>
                      <span className="inline-flex items-center gap-1 text-brand-zard">
                        <Star size={12} fill="currentColor" />
                        {review.rating}/5
                      </span>
                      <AdminBadge>{STATES[review.moderationState] ?? review.moderationState}</AdminBadge>
                    </div>
                  </div>
                  <div className="text-xs text-brand-m_khonsa" dir="ltr">
                    {review.date ? new Date(review.date).toLocaleString("fa-IR") : "—"}
                  </div>
                </div>

                <div className="mx-4 whitespace-pre-wrap rounded-[4px] border border-white/[.04] bg-brand-bg p-4 text-sm leading-7 text-white">
                  {review.content}
                </div>

                <div className="flex flex-wrap gap-2 p-4 pt-3">
                  {state !== "published" && (
                    <AdminButton
                      variant="primary"
                      onClick={() => void moderate(review.databaseId, "approve")}
                      disabled={busyId !== null}
                      className="min-h-9 px-3 text-xs"
                    >
                      <Check size={14} /> تأیید
                    </AdminButton>
                  )}
                  {state !== "hidden" && (
                    <AdminButton
                      onClick={() => void moderate(review.databaseId, "hide")}
                      disabled={busyId !== null}
                      className="min-h-9 px-3 text-xs"
                    >
                      <EyeOff size={14} /> مخفی
                    </AdminButton>
                  )}
                  {state !== "flagged" && (
                    <AdminButton
                      variant="danger"
                      onClick={() => void moderate(review.databaseId, "flag")}
                      disabled={busyId !== null}
                      className="min-h-9 px-3 text-xs"
                    >
                      <Flag size={14} /> علامت‌گذاری
                    </AdminButton>
                  )}
                </div>
              </AdminCard>
            ))}
          </div>
        </div>
      )}

      <AdminLoadMore visible={data.pageInfo.hasNextPage} loading={loadingMore} onClick={loadMore} />
    </AdminPage>
  );
}