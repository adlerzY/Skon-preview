"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";

interface WishlistButtonProps {
  productId: number;
  initialActive: boolean;
  isLoggedIn: boolean;
}

export default function WishlistButton({ productId, initialActive, isLoggedIn }: WishlistButtonProps) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
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
      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border transition-colors ${
        active
          ? "bg-brand-blue/10 border-brand-blue text-brand-blue"
          : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:text-white"
      }`}
    >
      {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} fill={active ? "currentColor" : "none"} />}
      {active ? "در لیست علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
    </button>
  );
}