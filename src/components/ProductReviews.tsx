"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import AdminBadge from "@/components/ui/AdminBadge";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE, IS_STAFF_COOKIE } from "@/lib/auth/constants";

interface ReviewNode {
  id: string;
  databaseId?: number;
  parentDatabaseId?: number;
  isStaffReply?: boolean;
  content: string;
  date?: string;
  author?: { node?: { name?: string; avatarUrl?: string } };
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface ProductReviewsProps {
  productId: number;
  reviews?: ReviewNode[];
  pageInfo?: PageInfo;
  averageRating?: number;
  reviewCount?: number;
}

const MAX_CONTENT_LENGTH = 500;

function StarRating({ rating, size = "text-xs" }: { rating: number; size?: string }) {
  return (
    <div className={`flex gap-1 text-brand-zard ${size}`} aria-label={`امتیاز ${rating} از ۵`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "text-brand-zard" : "text-brand-surface_hover"}>★</span>
      ))}
    </div>
  );
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

function ReviewReplyForm({
  reviewId,
  onSubmitted,
  onCancel,
}: {
  reviewId: number;
  onSubmitted: (reply: ReviewNode) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setError("متن پاسخ خیلی کوتاه است");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "ثبت پاسخ با خطا مواجه شد");
        return;
      }
      onSubmitted({
        id: `local-${Date.now()}`,
        parentDatabaseId: reviewId,
        isStaffReply: true,
        content: trimmed,
        date: new Date().toISOString(),
        author: { node: { name: "پشتیبانی" } },
      });
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2 bg-brand-blue/5 border border-brand-blue/20 p-3">
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
      <textarea
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="پاسخ به‌عنوان پشتیبانی..."
        className="bg-brand-bg border border-brand-surface_hover p-2.5 text-xs text-brand-active focus:outline-none focus:border-brand-blue resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-brand-blue hover:bg-[#0062d1] disabled:opacity-60 text-white text-xs font-bold px-4 py-1.5 transition-colors flex items-center gap-1.5"
        >
          {isSubmitting && <Loader2 size={12} className="animate-spin" />}
          ثبت پاسخ
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-brand-m_khonsa hover:text-white text-xs font-bold px-3 py-1.5 transition-colors"
        >
          انصراف
        </button>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  replies,
  isStaff,
  onReplySubmitted,
}: {
  review: ReviewNode;
  replies: ReviewNode[];
  isStaff: boolean;
  onReplySubmitted: (reply: ReviewNode) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="bg-brand-menu p-5 border border-brand-surface_hover flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <UserAvatar src={review.author?.node?.avatarUrl} name={review.author?.node?.name} size="sm" />
          <span className="text-sm font-bold text-brand-active flex items-center gap-1.5">
            {review.author?.node?.name || "کاربر"}
            {review.isStaffReply && <AdminBadge />}
          </span>
        </div>
        {review.date && (
          <span className="text-xs text-brand-m_khonsa">
            {new Date(review.date).toLocaleDateString("fa-IR")}
          </span>
        )}
      </div>

      <p className="text-brand-surface_m text-sm leading-7 mt-2">{stripHtml(review.content)}</p>

      {isStaff && review.databaseId && !isReplying && (
        <button
          type="button"
          onClick={() => setIsReplying(true)}
          className="self-start text-[11px] font-bold text-brand-blue hover:text-white transition-colors mt-1"
        >
          پاسخ به‌عنوان پشتیبانی
        </button>
      )}

      {isReplying && review.databaseId && (
        <ReviewReplyForm
          reviewId={review.databaseId}
          onCancel={() => setIsReplying(false)}
          onSubmitted={(reply) => {
            onReplySubmitted(reply);
            setIsReplying(false);
          }}
        />
      )}

      {replies.length > 0 && (
        <div className="flex flex-col gap-3 mt-3 mr-4 md:mr-8 border-r-2 border-brand-blue/30 pr-4">
          {replies.map((reply) => (
            <div key={reply.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserAvatar src={reply.author?.node?.avatarUrl} name={reply.author?.node?.name} size="xs" />
                  <span className="text-xs font-bold text-brand-active flex items-center gap-1.5">
                    {reply.author?.node?.name || (reply.isStaffReply ? "پشتیبانی" : "کاربر")}
                    {reply.isStaffReply && <AdminBadge />}
                  </span>
                </div>
                {reply.date && (
                  <span className="text-[11px] text-brand-m_khonsa">
                    {new Date(reply.date).toLocaleDateString("fa-IR")}
                  </span>
                )}
              </div>
              <p className="text-brand-surface_m text-xs leading-6">{stripHtml(reply.content)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductReviews({
  productId,
  reviews: initialReviews = [],
  pageInfo: initialPageInfo,
  averageRating = 0,
  reviewCount,
}: ProductReviewsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [reviews, setReviews] = useState<ReviewNode[]>(initialReviews);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo ?? { hasNextPage: false, endCursor: null });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setIsLoggedIn(getClientCookie(LOGGED_IN_COOKIE) === "1");
    setIsStaff(getClientCookie(IS_STAFF_COOKIE) === "1");
    setIsChecking(false);
  }, []);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: ReviewNode[] = [];
    const repliesMap = new Map<number, ReviewNode[]>();

    for (const r of reviews) {
      if (r.parentDatabaseId) {
        const list = repliesMap.get(r.parentDatabaseId) ?? [];
        list.push(r);
        repliesMap.set(r.parentDatabaseId, list);
      } else {
        top.push(r);
      }
    }
    return { topLevel: top, repliesByParent: repliesMap };
  }, [reviews]);

  const totalReviews = reviewCount ?? topLevel.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedContent = content.trim();
    if (trimmedContent.length < 3) {
      setFeedback({ type: "error", message: "لطفاً متن نظر خود را وارد کنید." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, content: trimmedContent }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", message: data?.error || "ثبت نظر با خطا مواجه شد." });
        return;
      }

      setFeedback({
        type: "success",
        message: data?.message || "نظر شما ثبت شد و پس از تأیید ادمین نمایش داده می‌شود.",
      });
      setContent("");
      setRating(5);
    } catch {
      setFeedback({ type: "error", message: "خطا در ارتباط با سرور." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pageInfo.endCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/reviews/list?productId=${productId}&after=${encodeURIComponent(pageInfo.endCursor)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="w-full border-t border-brand-surface_hover pt-8 flex flex-col gap-6" dir="rtl">
      <h2 className="text-xl font-black text-brand-active border-r-4 border-brand-blue pr-3">
        نظرات کاربران
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          {isChecking ? (
            <div className="bg-brand-menu p-6 border border-brand-surface_hover h-[220px] animate-pulse" />
          ) : isLoggedIn ? (
            <form onSubmit={handleSubmit} className="bg-brand-menu p-6 border border-brand-surface_hover flex flex-col gap-4">
              <span className="text-sm font-bold text-brand-active">امتیاز و نظر خود را بنویسید</span>

              {feedback && (
                <p
                  className={`text-xs font-medium p-3 border ${
                    feedback.type === "success"
                      ? "text-brand-sabz bg-brand-sabz/10 border-brand-sabz/20"
                      : "text-red-500 bg-red-500/10 border-red-500/20"
                  }`}
                >
                  {feedback.message}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-brand-surface_m">امتیاز شما</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full md:w-40 bg-brand-surface border border-brand-surface_hover p-3 text-sm text-brand-active focus:border-brand-blue outline-none"
                >
                  <option value="5">۵ ستاره (عالی)</option>
                  <option value="4">۴ ستاره</option>
                  <option value="3">۳ ستاره</option>
                  <option value="2">۲ ستاره</option>
                  <option value="1">۱ ستاره</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <textarea
                  placeholder="متن نظر شما..."
                  rows={4}
                  value={content}
                  maxLength={MAX_CONTENT_LENGTH}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-brand-surface border border-brand-surface_hover p-3 text-sm text-brand-active focus:border-brand-blue outline-none resize-none"
                />
                <span className="text-[10px] text-brand-surface_m text-left">
                  {content.length}/{MAX_CONTENT_LENGTH}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-blue text-brand-active text-sm font-bold py-3 px-6 hover:bg-brand-blue/80 transition-colors self-start disabled:opacity-60"
              >
                {isSubmitting ? "در حال ارسال..." : "ثبت نظر"}
              </button>
            </form>
          ) : (
            <div className="bg-brand-menu p-6 border border-brand-surface_hover flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-sm text-brand-surface_m text-center sm:text-right">
                برای ثبت نظر، ابتدا باید وارد حساب کاربری خود شوید.
              </span>
              <Link
                href="/my-account"
                className="bg-brand-blue text-white text-sm font-bold py-2.5 px-6 hover:bg-brand-blue/80 transition-colors whitespace-nowrap"
              >
                ورود به حساب
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {topLevel.length === 0 ? (
              <div className="bg-brand-menu p-6 border border-brand-surface_hover text-center text-sm text-brand-surface_m">
                هنوز نظری برای این محصول ثبت نشده است. اولین نفر باشید!
              </div>
            ) : (
              <>
                {topLevel.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    replies={review.databaseId ? repliesByParent.get(review.databaseId) ?? [] : []}
                    isStaff={isStaff}
                    onReplySubmitted={(reply) => setReviews((prev) => [...prev, reply])}
                  />
                ))}

                {pageInfo.hasNextPage && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="self-center bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {isLoadingMore && <Loader2 size={14} className="animate-spin" />}
                    نمایش ۲۰ نظر بیشتر
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-brand-menu p-6 border border-brand-surface_hover flex flex-col items-center justify-center gap-4 text-center w-full">
          <span className="text-sm font-bold text-brand-surface_m">امتیاز کلی محصول</span>
          <div className="text-5xl font-black text-brand-blue">
            {averageRating.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}
          </div>
          <StarRating rating={Math.round(averageRating)} size="text-base" />
          <span className="text-xs text-brand-m_khonsa">
            براساس {totalReviews.toLocaleString("fa-IR")} نظر ثبت شده
          </span>
        </div>
      </div>
    </div>
  );
}