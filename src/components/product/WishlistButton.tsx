"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE } from "@/lib/auth/constants";
import { useToast } from "@/context/ToastContext";

interface WishlistButtonProps {
  productId: number;
  size?: number;
}

export default function WishlistButton({ productId, size = 22 }: WishlistButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [active, setActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const loggedIn = getClientCookie(LOGGED_IN_COOKIE) === "1";
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/account/wishlist/status?productId=${productId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setActive(Boolean(data?.inWishlist));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push("/my-account");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/account/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok && typeof data.inWishlist === "boolean") {
        setActive(data.inWishlist);
        showToast(data.inWishlist ? "به علاقه‌مندی‌ها اضافه شد ❤️" : "از علاقه‌مندی‌ها حذف شد");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || isChecking}
      aria-pressed={active}
      title={active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      className="inline-flex items-center justify-center shrink-0 text-brand-m_khonsa hover:text-brand-blue transition-colors disabled:opacity-50"
    >
      {isLoading || isChecking ? (
        <Loader2 size={size} className="animate-spin" />
      ) : (
        <Heart size={size} className={active ? "text-brand-blue" : ""} fill={active ? "currentColor" : "none"} />
      )}
    </button>
  );
}