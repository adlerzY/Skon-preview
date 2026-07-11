import Link from "next/link";
import Image from "next/image";
import UserActions from "./UserActions";
import DesktopNavLinks from "./DesktopNavLinks";
import MobileMenu from "./MobileMenu";
import HeaderSearch from "./HeaderSearch";
import HeaderMenuSwitcher from "./HeaderMenuSwitcher";
import HeaderCart from "./HeaderCart";
import RegionSwitcher from "./RegionSwitcher";
import { Download, HelpCircle } from "lucide-react";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getHeaderCategories, getHeaderBlogCategories, getRegions } from "@/lib/graphql";
import { getCurrentUser } from "@/lib/auth/session";

const ACTION_BUTTON_CLASSES =
  "flex items-center gap-2.5 px-3 py-4 cursor-pointer text-brand-m_khonsa text-[14px] font-semibold transition-colors duration-150 hover:bg-brand-surface hover:text-white";
const ICON_WRAPPER_CLASSES =
  "flex items-center justify-center rounded-full w-5 h-5 text-brand-surface_m shrink-0";

export default async function Header() {
  const cookieStore = await cookies();
  const activeRegion = cookieStore.get("store_region")?.value || "eu";

  const [shopGames, blogCats, regions, user] = await Promise.all([
    getHeaderCategories(),
    getHeaderBlogCategories(),
    getRegions().catch(() => []),
    getCurrentUser().catch(() => null),
  ]);

  return (
    <header className="w-full sticky top-0 lg:top-[-60px] z-[10000] bg-[#15171e]" dir="rtl">
      <div className="hidden lg:flex w-full justify-between items-center h-[60px] px-6 max-w-[1600px] mx-auto">
        <div className="flex items-center h-full gap-8">
          <Link href={`/${activeRegion}`} className="flex items-center shrink-0" aria-label="صفحه اصلی">
            <Image
              src="/images/arena2battleLogo.webp"
              alt="Arena2Battle"
              width={100}
              height={40}
              className="h-10 w-auto object-contain"
              priority
              style={{ width: "auto" }}
            />
          </Link>
          <DesktopNavLinks activeRegion={activeRegion} />
        </div>

        <div className="flex items-center">
          <Link href="/download" className={ACTION_BUTTON_CLASSES}>
            <span className={ICON_WRAPPER_CLASSES}>
              <Download size={18} strokeWidth={2.5} />
            </span>
            <span>دانلود بازی</span>
          </Link>

          <Link href="/support" className={ACTION_BUTTON_CLASSES}>
            <span className={ICON_WRAPPER_CLASSES}>
              <HelpCircle size={18} strokeWidth={2.5} />
            </span>
            <span>پشتیبانی</span>
          </Link>

          <UserActions user={user ? { name: user.name, avatarUrl: user.avatarUrl } : null} />
        </div>
      </div>

      <div className="hidden lg:flex w-full justify-center bg-brand-bg">
        <div className="flex w-full container mx-auto px-6 max-w-[1600px] py-[10px] gap-[8px] h-[80px]">
          <div className="flex items-center justify-between flex-1 bg-brand-surface h-full pl-2 rounded-[5px]">
            <HeaderCart />
            <HeaderMenuSwitcher shopItems={shopGames} blogItems={blogCats} />
          </div>

          <HeaderSearch />

          <div className="flex items-center justify-center h-full">
            <Suspense fallback={<div className="w-[140px] h-[60px] bg-brand-surface/50 animate-pulse rounded-[4px]" />}>
              <RegionSwitcher regions={regions} initialRegion={activeRegion} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="lg:hidden flex items-center justify-between h-[60px] px-4 bg-brand-bg border-b border-white/5">
        <MobileMenu shopItems={shopGames} blogItems={blogCats} />
      </div>
    </header>
  );
}