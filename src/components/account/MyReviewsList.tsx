"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
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

  if (reviews.length === 0) {
    return <Card className="p-10 text-center text-brand-m_khonsa">هنوز دیدگاهی ثبت نکرده‌اید.</Card>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <Card key={review.databaseId} className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-white">{review.productName}</span>
              <StarRow rating={review.rating} />
            </div>
            <div className="flex items-center gap-2">
              {review.date && <span className="text-xs text-brand-m_khonsa">{new Date(review.date).toLocaleDateString("fa-IR")}</span>}
              <Badge tone={review.approved ? "sabz" : "zard"}>{review.approved ? "تأیید شده" : "در انتظار تأیید"}</Badge>
            </div>
          </div>

          <p className="text-sm text-brand-active leading-7">{review.content}</p>

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
      ))}

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