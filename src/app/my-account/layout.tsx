import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import DashboardShell from "@/components/account/DashboardShell";
import MobileBottomNav from "@/components/Header/MobileBottomNav";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-brand-bg flex flex-col" dir="rtl">
        <div className="w-full flex items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" aria-label="صفحه اصلی">
            <Image
              src="/images/arena2battleLogo.webp"
              alt="Arena2Battle"
              width={130}
              height={44}
              style={{ width: "auto" }}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-brand-m_khonsa hover:text-white transition-colors"
          >
            <ChevronRight size={14} />
            بازگشت به فروشگاه
          </Link>
        </div>

        <div className="flex-1 w-full flex items-center justify-center p-5 pb-[calc(58px+env(safe-area-inset-bottom)+20px)] lg:pb-5">
          {children}
        </div>

        <MobileBottomNav user={null} />
      </div>
    );
  }

  return (
    <DashboardShell user={{ avatarUrl: user.avatarUrl, name: user.name, isStaff: user.isStaff }}>
      {children}
    </DashboardShell>
  );
}