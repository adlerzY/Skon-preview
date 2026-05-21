// components/Header.tsx
import Link from "next/link";
import Image from "next/image";
import UserActions from "./UserActions";
import DesktopNavLinks from "./DesktopNavLinks";
import MobileMenu from "./MobileMenu";
import HeaderSearch from "./HeaderSearch";
import HeaderMenuSwitcher from "./HeaderMenuSwitcher";

import { getHeaderCategories, getHeaderBlogCategories } from "@/lib/wp-graphql"; 

const ACTION_BUTTON_CLASSES = "flex items-center gap-2.5 px-3 py-4 cursor-pointer text-brand-m_khonsa text-[14px] font-semibold transition-colors duration-150 hover:bg-brand-surface hover:text-white";
const ICON_WRAPPER_CLASSES = "flex items-center justify-center rounded-full w-5 h-5 text-brand-surface_m shrink-0";

export default async function Header() {
  const [shopGames, blogCats] = await Promise.all([
    getHeaderCategories(),
    getHeaderBlogCategories()
  ]);

  const cartCount = 0;

  return (
    // بک‌گراند اصلی هدر تمام‌عرض است
    <header className="w-full sticky top-0 lg:top-[-60px] z-[10000] bg-[#15171e]" dir="rtl">
      
      {/* لایه اول دسکتاپ: با محدودیت 1600 پیکسل */}
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
              sizes="100px"
              style={{ height: 'auto' }}
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

      {/* لایه دوم دسکتاپ: پس‌زمینه سرتاسری و محتوای 1600 پیکسل */}
      <div className="hidden lg:flex w-full justify-center bg-brand-bg">
        <div className="flex w-full container mx-auto px-6 max-w-[1600px] py-[10px] gap-[8px] h-[80px]">
          <div className="flex items-center justify-between flex-1 bg-brand-surface h-full pl-2 rounded-[5px]">
            <div className="relative h-full group flex items-center z-[100]">
              <Link href="/cart" className="relative text-brand-m_khonsa w-[55px] h-full flex items-center justify-center transition-colors hover:text-white hover:bg-white/5 rounded-[5px]" aria-label="سبد خرید">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                {cartCount > 0 && <span className="absolute top-3 right-3 bg-brand-blue text-white text-[11px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shadow-md">{cartCount}</span>}
              </Link>
              
              <div className="absolute top-[68px] right-0 bg-brand-menu opacity-0 invisible translate-y-1.5 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 p-4 z-[100] min-w-[300px] border border-brand-surface shadow-xl will-change-transform">
                <p className="text-brand-m_khonsa text-right text-sm border-b pb-2 font-medium">وضعیت سبد خرید</p>
                <div className="py-8 text-center text-[13px] font-bold">سبد خرید شما خالی است</div>
              </div>
            </div>

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

      <MobileMenu cartCount={cartCount} />

    </header>
  );
}