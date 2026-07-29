"use client";

import { useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

interface FollowCategoryButtonProps {
  categoryId: number;
  initialFollowerCount?: number;
  isLoggedIn: boolean;
  initialIsFollowing?: boolean;
}

export default function FollowCategoryButton({
  categoryId,
  initialFollowerCount = 0,
  isLoggedIn,
  initialIsFollowing = false,
}: FollowCategoryButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/my-account");
      return;
    }

    setIsLoading(true);
    const nextState = !isFollowing;

    try {
      const res = await fetch("/api/blog/follow/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, follow: nextState }),
      });
      
      const data = await res.json();

      if (res.ok && typeof data.isFollowing === "boolean") {
        setIsFollowing(data.isFollowing);
        setFollowerCount((c) => c + (data.isFollowing ? 1 : -1));
        showToast(
          data.isFollowing
            ? "دنبال کردن این دسته‌بندی فعال شد 🔔"
            : "دنبال کردن لغو شد"
        );
      }
    } catch {
      showToast("خطایی رخ داد، لطفاً مجدداً تلاش کنید");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer ${
        isFollowing
          ? "bg-brand-blue text-white hover:bg-[#0062d1]"
          : "bg-white/5 text-brand-m_khonsa border border-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      {isLoading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isFollowing ? (
        <BellRing size={15} />
      ) : (
        <Bell size={15} />
      )}
      <span>{isFollowing ? "دنبال می‌کنید" : "دنبال کردن اخبار"}</span>
      {followerCount > 0 && (
        <span
          className={`text-[11px] ${
            isFollowing ? "text-white/70" : "text-brand-surface_m"
          }`}
        >
          ({followerCount.toLocaleString("fa-IR")})
        </span>
      )}
    </button>
  );
}