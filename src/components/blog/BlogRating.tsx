"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BlogRatingProps {
  postId: number;
  initialAverage?: number;
  initialCount?: number;
  isLoggedIn: boolean;
  initialMyRating?: number | null;
}

export default function BlogRating({
  postId,
  initialAverage = 0,
  initialCount = 0,
  isLoggedIn,
  initialMyRating = null,
}: BlogRatingProps) {
  const router = useRouter();
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [myRating, setMyRating] = useState<number | null>(initialMyRating);
  const [hovered, setHovered] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (value: number) => {
    if (!isLoggedIn) {
      router.push("/my-account");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/blog/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, rating: value }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAverage(data.averageRating ?? average);
        setCount(data.ratingCount ?? count);
        setMyRating(data.myRating ?? value);
      }
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayValue = hovered ?? myRating ?? Math.round(average);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-3xl font-black text-brand-blue">
        {average.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}
      </div>

      <div
        className="flex gap-1 text-brand-zard"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              disabled={isSubmitting}
              onMouseEnter={() => setHovered(value)}
              onClick={() => handleRate(value)}
              aria-label={`${value} ستاره`}
              className="disabled:opacity-60 cursor-pointer transition-transform hover:scale-110"
            >
              <Star
                size={20}
                fill={value <= displayValue ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>

      <span className="text-[11px] text-brand-m_khonsa">
        {count > 0
          ? `${count.toLocaleString("fa-IR")} نفر امتیاز داده‌اند`
          : "هنوز کسی امتیاز نداده"}
      </span>

      {isSubmitting && (
        <Loader2 size={12} className="animate-spin text-brand-m_khonsa" />
      )}
    </div>
  );
}