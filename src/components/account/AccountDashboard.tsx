import Link from "next/link";
import { Package } from "lucide-react";
import LogoutButton from "./LogoutButton";
import type { SessionUser } from "@/lib/auth/session";

export default function AccountDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-brand-surface border border-brand-surface_hover p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center text-brand-blue font-black text-xl shrink-0">
          {user.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex flex-col gap-1 overflow-hidden">
          <span className="font-bold text-lg text-white truncate">{user.name}</span>
          <span className="text-xs text-brand-m_khonsa truncate" dir="ltr">{user.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/my-account/orders"
          className="bg-brand-surface hover:bg-brand-surface_hover border border-brand-surface_hover p-5 flex items-center gap-3 transition-colors"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue shrink-0">
            <Package size={20} />
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm">سفارش‌های من</span>
            <span className="text-xs text-brand-m_khonsa">مشاهده‌ی تاریخچه‌ی خرید</span>
          </div>
        </Link>

        <LogoutButton />
      </div>
    </div>
  );
}