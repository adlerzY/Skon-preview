"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/my-account");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="bg-brand-surface hover:bg-red-500/10 border border-brand-surface_hover hover:border-red-500/30 p-5 flex items-center gap-3 transition-colors text-right disabled:opacity-50"
    >
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-500 shrink-0">
        <LogOut size={20} />
      </span>
      <div className="flex flex-col">
        <span className="font-bold text-red-500 text-sm">
          {isLoading ? "در حال خروج..." : "خروج از حساب"}
        </span>
        <span className="text-xs text-brand-m_khonsa">پایان نشست کاربری</span>
      </div>
    </button>
  );
}