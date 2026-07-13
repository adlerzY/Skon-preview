"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { getClientCookie } from "@/lib/cookies";
import { LOGGED_IN_COOKIE } from "@/lib/auth/constants";

interface WishlistButtonProps {
  productId: number;
}

export default function WishlistButton({ productId }: WishlistButtonProps) {
  const router = useRouter();
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
      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border transition-colors ${
        active
          ? "bg-brand-blue/10 border-brand-blue text-brand-blue"
          : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:text-white"
      }`}
    >
      {isLoading || isChecking ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} fill={active ? "currentColor" : "none"} />}
      {active ? "در لیست علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
    </button>
  );
}