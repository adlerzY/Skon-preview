import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import DashboardShell from "@/components/account/DashboardShell";
import MobileBottomNav from "@/components/Header/MobileBottomNav";
import AccountLayoutSkeleton from "@/components/account/AccountLayoutSkeleton";
import SessionUnavailable from "@/components/account/SessionUnavailable";
import AccountProviders from "@/components/providers/AccountProviders";
import { getAuthToken, getSessionState } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "حساب کاربری",
};

function LoggedOutFrame({
  children,
  unavailable = false,
}: {
  children: React.ReactNode;
  unavailable?: boolean;
}) {
  return (
    <div className="h-[100dvh] w-full bg-brand-bg flex flex-col overflow-hidden" dir="rtl">
      <header className="w-full flex items-center justify-between px-5 py-4 md:px-8 shrink-0">
        <Link href="/" aria-label="صفحه اصلی">
          <Image
            src="/images/arena2battleLogo.webp"
            alt="Arena2Battle"
            width={130}
            height={44}
            style={{ width: "auto" }}
            className="h-9 w-auto object-contain"
          />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-brand-m_khonsa hover:text-white transition-colors"
        >
          <ChevronRight size={14} />
          بازگشت به فروشگاه
        </Link>
      </header>

      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-4 md:p-5 overflow-y-auto pb-[calc(58px+env(safe-area-inset-bottom)+12px)] lg:pb-4">
        {unavailable ? <SessionUnavailable /> : children}
      </main>

      <MobileBottomNav user={null} />
    </div>
  );
}

async function AccountLayoutContent({ children }: { children: React.ReactNode }) {
  const state = await getSessionState();

  if (state.status !== "authenticated") {
    return <LoggedOutFrame unavailable={state.status === "unavailable"}>{children}</LoggedOutFrame>;
  }

  const { user } = state;

  return (
    <DashboardShell user={{ avatarUrl: user.avatarUrl, name: user.name, isStaff: user.isStaff }}>
      {children}
    </DashboardShell>
  );
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const token = await getAuthToken();

  return (
    <AccountProviders>
      {token ? (
        <Suspense fallback={<AccountLayoutSkeleton />}>
          <AccountLayoutContent>{children}</AccountLayoutContent>
        </Suspense>
      ) : (
        <LoggedOutFrame>{children}</LoggedOutFrame>
      )}
    </AccountProviders>
  );
}