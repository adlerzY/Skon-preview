"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE } from "@/lib/auth/constants";
import { useToast } from "@/context/ToastContext";

export default function FollowCategoryButton({
  categoryId,
  initialFollowerCount = 0,
}: {
  categoryId: number;
  initialFollowerCount?: number;
}) {
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loggedIn = getClientCookie(LOGGED_IN_COOKIE) === "1";
    setIsLoggedIn(loggedIn);
    if (!loggedIn) {
      setIsChecking(false);
      return;
    }
    fetch(`/api/blog/follow/status?categoryId=${categoryId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setIsFollowing(Boolean(data?.isFollowing)))
      .finally(() => setIsChecking(false));
  }, [categoryId]);

  const handleClick = async () => {
    if (!isLoggedIn) {
      window.location.href = "/my-account";
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
        showToast(data.isFollowing ? "دنبال کردن این دسته‌بندی فعال شد 🔔" : "دنبال کردن لغو شد");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) return <div className="h-10 w-32 bg-white/5 animate-pulse rounded-xl" />;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
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
      {isFollowing ? "دنبال می‌کنید" : "دنبال کردن اخبار"}
      {followerCount > 0 && (
        <span className={`text-[11px] ${isFollowing ? "text-white/70" : "text-brand-surface_m"}`}>
          ({followerCount.toLocaleString("fa-IR")})
        </span>
      )}
    </button>
  );
}