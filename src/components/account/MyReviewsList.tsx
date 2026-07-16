"use client";

import { useState } from "react";
import { Loader2, Star, Pencil, Trash2, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface ReviewReply {
  content: string;
  date?: string;
  authorName?: string;
}

interface ReviewNode {
  databaseId: number;
  content: string;
  rating: number;
  date?: string;
  approved: boolean;
  productId: number;
  productName: string;
  productSlug: string;
  replies: ReviewReply[];
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-brand-zard">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function StarPicker({ rating, onChange }: { rating: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1 text-brand-zard">
      {Array.from({ length: 5 }).map((_, i) => {
        const value = i + 1;
        return (
          <button key={value} type="button" onClick={() => onChange(value)} aria-label={`${value} ستاره`}>
            <Star size={18} fill={value <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

export default function MyReviewsList({
  initialReviews,
  initialPageInfo,
}: {
  initialReviews: ReviewNode[];
  initialPageInfo: PageInfo;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleLoadMore = async () => {
    if (!pageInfo.endCursor) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/account/reviews?after=${encodeURIComponent(pageInfo.endCursor)}`, { cache: "no-store" });
      const data = await res.json();
      setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (review: ReviewNode) => {
    setEditingId(review.databaseId);
    setEditContent(review.content);
    setEditRating(review.rating);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const saveEdit = async (reviewId: number) => {
    if (editContent.trim().length < 3) {
      setEditError("متن نظر خیلی کوتاه است");
      return;
    }
    setIsSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/reviews/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, content: editContent.trim(), rating: editRating }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data?.error || "ویرایش نظر با خطا مواجه شد");
        return;
      }
      setReviews((prev) =>
        prev.map((r) => (r.databaseId === reviewId ? { ...r, content: editContent.trim(), rating: editRating } : r))
      );
      setEditingId(null);
    } catch {
      setEditError("خطا در ارتباط با سرور");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (reviewId: number) => {
    setDeletingId(reviewId);
    try {
      const res = await fetch("/api/reviews/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.databaseId !== reviewId));
      }
    } finally {
      setDeletingId(null);
      setConfirmingDeleteId(null);
    }
  };

  if (reviews.length === 0) {
    return <Card className="p-10 text-center text-brand-m_khonsa">هنوز دیدگاهی ثبت نکرده‌اید.</Card>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => {
        const isEditing = editingId === review.databaseId;
        const isConfirmingDelete = confirmingDeleteId === review.databaseId;
        const isDeleting = deletingId === review.databaseId;

        return (
          <Card key={review.databaseId} className="p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-white">{review.productName}</span>
                {isEditing ? <StarPicker rating={editRating} onChange={setEditRating} /> : <StarRow rating={review.rating} />}
              </div>
              <div className="flex items-center gap-2">
                {review.date && <span className="text-xs text-brand-m_khonsa">{new Date(review.date).toLocaleDateString("fa-IR")}</span>}
                <Badge tone={review.approved ? "sabz" : "zard"}>{review.approved ? "تأیید شده" : "در انتظار تأیید"}</Badge>
              </div>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2">
                {editError && <span className="text-xs text-red-500 font-medium">{editError}</span>}
                <textarea
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="bg-brand-bg border border-brand-surface_hover p-3 text-sm text-brand-active focus:outline-none focus:border-brand-blue transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(review.databaseId)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-xs font-bold px-4 py-2 transition-colors"
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    ذخیره
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-brand-bg border border-brand-surface_hover hover:bg-brand-surface_hover text-brand-m_khonsa text-xs font-bold px-4 py-2 transition-colors"
                  >
                    <X size={13} />
                    انصراف
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-active leading-7">{review.content}</p>
            )}

            {!isEditing && (
              <div className="flex items-center gap-2 pt-1 border-t border-brand-surface_hover/60 mt-1">
                {!review.approved && (
                  <button
                    type="button"
                    onClick={() => startEdit(review)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-brand-blue hover:text-white transition-colors"
                  >
                    <Pencil size={12} />
                    ویرایش
                  </button>
                )}

                {isConfirmingDelete ? (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-brand-m_khonsa">حذف این نظر مطمئنید؟</span>
                    <button
                      type="button"
                      onClick={() => confirmDelete(review.databaseId)}
                      disabled={isDeleting}
                      className="font-bold text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      {isDeleting && <Loader2 size={12} className="animate-spin" />}
                      بله، حذف کن
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      disabled={isDeleting}
                      className="font-bold text-brand-m_khonsa hover:text-white"
                    >
                      انصراف
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(review.databaseId)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                    حذف
                  </button>
                )}
              </div>
            )}

            {review.replies.length > 0 && (
              <div className="flex flex-col gap-2 mt-1 mr-4 border-r-2 border-brand-blue/30 pr-4">
                {review.replies.map((reply, idx) => (
                  <div key={idx} className="flex flex-col gap-1 bg-brand-blue/5 border border-brand-blue/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-blue">{reply.authorName || "پشتیبانی"}</span>
                      {reply.date && <span className="text-[11px] text-brand-m_khonsa">{new Date(reply.date).toLocaleDateString("fa-IR")}</span>}
                    </div>
                    <p className="text-xs text-brand-surface_m leading-6">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      {pageInfo.hasNextPage && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoading}
          className="self-center mt-2 bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          نمایش دیدگاه‌های بیشتر
        </button>
      )}
    </div>
  );
}