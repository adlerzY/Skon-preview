"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE } from "@/lib/auth/constants";

interface ReviewNode {
  id: string;
  content: string;
  date?: string;
  author?: { node?: { name?: string; avatarUrl?: string } };
}

interface ProductReviewsProps {
  productId: number;
  reviews?: ReviewNode[];
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

export default function ProductReviews({
  productId,
  reviews = [],
  averageRating = 0,
  reviewCount,
}: ProductReviewsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setIsLoggedIn(getClientCookie(LOGGED_IN_COOKIE) === "1");
    setIsChecking(false);
  }, []);

  const totalReviews = reviewCount ?? reviews.length;

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
            {reviews.length === 0 ? (
              <div className="bg-brand-menu p-6 border border-brand-surface_hover text-center text-sm text-brand-surface_m">
                هنوز نظری برای این محصول ثبت نشده است. اولین نفر باشید!
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-brand-menu p-5 border border-brand-surface_hover flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar src={review.author?.node?.avatarUrl} name={review.author?.node?.name} size="sm" />
                      <span className="text-sm font-bold text-brand-active">
                        {review.author?.node?.name || "کاربر"}
                      </span>
                    </div>
                    {review.date && (
                      <span className="text-xs text-brand-m_khonsa">
                        {new Date(review.date).toLocaleDateString("fa-IR")}
                      </span>
                    )}
                  </div>
                  <p className="text-brand-surface_m text-sm leading-7 mt-2">{stripHtml(review.content)}</p>
                </div>
              ))
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