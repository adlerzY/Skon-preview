"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface WishlistButtonProps {
  productId: number;
  size?: number;
  isLoggedIn?: boolean;
  initialInWishlist?: boolean;
}

export default function WishlistButton({ productId, size = 22, isLoggedIn = false, initialInWishlist = false }: WishlistButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [active, setActive] = useState(initialInWishlist);
  const [isLoading, setIsLoading] = useState(false);

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
      disabled={isLoading}
      aria-pressed={active}
      title={active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      className="inline-flex items-center justify-center shrink-0 text-brand-m_khonsa hover:text-brand-blue transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 size={size} className="animate-spin" />
      ) : (
        <Heart size={size} className={active ? "text-brand-blue" : ""} fill={active ? "currentColor" : "none"} />
      )}
    </button>
  );
}