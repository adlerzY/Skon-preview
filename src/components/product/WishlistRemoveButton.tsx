"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function WishlistRemoveButton({
  productId,
  onRemoved,
}: {
  productId: number;
  onRemoved?: (productId: number) => void;
}) {
  const { showToast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);
    try {
      const res = await fetch("/api/account/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok && data.inWishlist === false) {
        onRemoved?.(productId);
        showToast("از علاقه‌مندی‌ها حذف شد");
      }
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isRemoving}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-brand-blue/10 border border-brand-blue text-brand-blue"
    >
      {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} fill="currentColor" />}
      در علاقه‌مندی‌ها
    </button>
  );
}