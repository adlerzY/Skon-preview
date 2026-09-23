import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import DesktopNavLinks from "./DesktopNavLinks";
import HeaderSearch from "./HeaderSearch";
import HeaderCart from "./HeaderCart";
import HeaderMenuSwitcherAsync from "./HeaderMenuSwitcherAsync";
import RegionSwitcherAsync from "./RegionSwitcherAsync";
import UserActionsAsync from "./UserActionsAsync";
import GamesNavSkeleton from "./GamesNavSkeleton";
import MobileMenuAsync from "./MobileMenuAsync";
import MobileBottomNavAsync from "./MobileBottomNavAsync";
import { HeaderViewerProvider } from "./HeaderViewerProvider";
import { Download, HelpCircle } from "lucide-react";
import SiteNoticeAsync from "./SiteNoticeAsync";
import { getSiteNotice } from "@/lib/maintenance";

const ACTION_BUTTON_CLASSES =
  "flex items-center gap-2.5 px-3 py-4 cursor-pointer text-brand-m_khonsa text-[14px] font-semibold transition-colors duration-150 hover:bg-brand-surface hover:text-white";
const ICON_WRAPPER_CLASSES =
  "flex items-center justify-center rounded-full w-5 h-5 text-brand-surface_m shrink-0";

export default async function Header({ activeRegion }: { activeRegion: string }) {
  const siteNoticePromise = getSiteNotice()
    .then((notice) =>
      notice.enabled && notice.title && notice.message
        ? { title: notice.title, message: notice.message }
        : null
    )
    .catch(() => null);

  return (
    <HeaderViewerProvider>
      <header data-storefront-header className="w-full sticky top-0 lg:top-[-60px] z-[10000] bg-brand-bg" dir="rtl">
        <div className="hidden lg:flex relative w-full justify-between items-center h-[60px] px-6 max-w-[1600px] mx-auto">
          <div className="flex items-center h-full gap-8">
            <Link href={`/${activeRegion}`} className="flex items-center shrink-0" aria-label="صفحه اصلی">
              <Image
                src="/images/arena2battleLogo.webp"
                alt="Arena2Battle"
                width={100}
                height={40}
                className="h-10 w-auto object-contain"
                style={{ width: "auto" }}
              />
            </Link>
            <DesktopNavLinks activeRegion={activeRegion} />
          </div>

          <div className="relative shrink-0">
            <Suspense fallback={null}>
              <SiteNoticeAsync noticePromise={siteNoticePromise} desktop />
            </Suspense>
          </div>

          <div className="flex items-center">
            <Link href={`/${activeRegion}/download`} className={ACTION_BUTTON_CLASSES}>
              <span className={ICON_WRAPPER_CLASSES}>
                <Download size={18} strokeWidth={2.5} />
              </span>
              <span>دانلود بازی</span>
            </Link>

            <Link href={`/${activeRegion}/support`} className={ACTION_BUTTON_CLASSES}>
              <span className={ICON_WRAPPER_CLASSES}>
                <HelpCircle size={18} strokeWidth={2.5} />
              </span>
              <span>پشتیبانی</span>
            </Link>

            <UserActionsAsync />
          </div>
        </div>

        <div className="hidden lg:flex w-full justify-center bg-brand-bg">
          <div className="flex w-full container mx-auto px-6 max-w-[1600px] py-[10px] gap-[8px] h-[80px]">
            <div className="flex items-center justify-between flex-1 bg-brand-surface h-full pl-2 rounded-[5px]">
              <HeaderCart />
              <Suspense fallback={<GamesNavSkeleton />}>
                <HeaderMenuSwitcherAsync />
              </Suspense>
            </div>

            <HeaderSearch />

            <div className="flex items-center justify-center h-full">
              <Suspense fallback={<RegionSwitcherImmediateFallback region={activeRegion} />}>
                <RegionSwitcherAsync initialRegion={activeRegion} />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <MobileMenuAsync activeRegion={activeRegion} siteNoticePromise={siteNoticePromise} />
        </div>
      </header>

      <MobileBottomNavAsync />
    </HeaderViewerProvider>
  );
}

function RegionSwitcherImmediateFallback({ region }: { region: string }) {
  const labels: Record<string, string> = {
    eu: "اروپا (EU)",
    us: "آمریکا (US)",
    tr: "ترکیه (TR)",
    ua: "اوکراین (UA)",
  };

  return (
    <div
      className="flex items-center justify-between gap-2 px-3 h-[60px] w-[140px] bg-brand-surface text-white text-[13px] font-semibold rounded-[5px]"
      aria-label="منطقه فعال"
    >
      <span className="truncate">{labels[region.toLowerCase()] ?? region.toUpperCase()}</span>
      <span className="text-brand-m_khonsa shrink-0" aria-hidden="true">⌄</span>
    </div>
  );
}

