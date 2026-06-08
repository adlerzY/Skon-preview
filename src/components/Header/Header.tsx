// components/Header/Header.tsx
import Link from "next/link";
import Image from "next/image";
import UserActions from "./UserActions";
import DesktopNavLinks from "./DesktopNavLinks";
import MobileMenu from "./MobileMenu";
import HeaderSearch from "./HeaderSearch";
import HeaderMenuSwitcher from "./HeaderMenuSwitcher";
import HeaderCart from "./HeaderCart";

import { getHeaderCategories, getHeaderBlogCategories } from "@/lib/graphql"; 

const ACTION_BUTTON_CLASSES = "flex items-center gap-2.5 px-3 py-4 cursor-pointer text-brand-m_khonsa text-[14px] font-semibold transition-colors duration-150 hover:bg-brand-surface hover:text-white";
const ICON_WRAPPER_CLASSES = "flex items-center justify-center rounded-full w-5 h-5 text-brand-surface_m shrink-0";

export default async function Header() {
  const [shopGames, blogCats] = await Promise.all([
    getHeaderCategories(),
    getHeaderBlogCategories()
  ]);

  return (
    <header className="w-full sticky top-0 lg:top-[-60px] z-[10000] bg-[#15171e]" dir="rtl">
      
      <div className="hidden lg:flex w-full justify-between items-center h-[60px] container mx-auto px-6 max-w-[1600px]">
        <div className="flex items-center h-full gap-8">
          <Link href="/" className="flex items-center shrink-0" aria-label="Home">
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
          <DesktopNavLinks />
        </div>

        <div className="flex items-center ">
          <Link href="/download" className={ACTION_BUTTON_CLASSES}>
            <span className={ICON_WRAPPER_CLASSES}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </span>
            <span>دانلود بازی</span>
          </Link>

          <Link href="/support" className={ACTION_BUTTON_CLASSES}>
            <span className={ICON_WRAPPER_CLASSES}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </span>
            <span>پشتیبانی</span>
          </Link>

          <UserActions />
        </div>
      </div>

      <div className="hidden lg:flex w-full justify-center bg-brand-bg">
        <div className="flex w-full container mx-auto px-6 max-w-[1600px] py-[10px] gap-[8px] h-[80px]">
          <div className="flex items-center justify-between flex-1 bg-brand-surface h-full pl-2 rounded-[5px]">
            
            <HeaderCart />

            <HeaderMenuSwitcher shopItems={shopGames} blogItems={blogCats} />

          </div>

          <HeaderSearch />

          <div className="flex items-center justify-center h-full bg-brand-surface hover:bg-brand-surface_hover duration-150 overflow-hidden group rounded-[5px]">
            <Link href="/guild-portal" className="flex items-center justify-center h-full px-7 text-brand-m_khonsa text-[15px] font-semibold hover:text-brand-white duration-150 transition-colors relative">
              پورتال گیلد
            </Link>
          </div>
        </div>
      </div>

      <MobileMenu />

    </header>
  );
}