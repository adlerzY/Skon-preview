// src/components/Header/MobileMenu.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useProductSearch } from "./hooks/useProductSearch";
import MiniSearchCard from "./MiniSearchCard";
import MobileRegionSwitcher from "./MobileRegionSwitcher";
import UserAvatar from "@/components/ui/UserAvatar";
import Skeleton from "@/components/ui/Skeleton";
import { Menu, Search, User, X, ChevronDown, ChevronLeft } from "lucide-react";
import { useActiveRegion, buildRegionHref } from "@/lib/hooks/useActiveRegion";

interface MobileMenuItem {
  title: string;
  img: string;
  link: string;
}

interface Region {
  name: string;
  slug: string;
  flagUrl?: string;
}

interface MobileMenuProps {
  shopItems: MobileMenuItem[];
  blogItems: MobileMenuItem[];
  user: { name: string; avatarUrl?: string | null } | null;
  regions: Region[];
  activeRegion: string;
}

export default function MobileMenu({ shopItems, blogItems, user, regions, activeRegion }: MobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { region: currentRegion } = useActiveRegion();
  const buildHref = (link: string) => buildRegionHref(currentRegion, link);

  const [isOpen, setIsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery, searchResults, isPending } =
    useProductSearch();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isSearchActive) {
      searchInputRef.current?.focus();
    }
  }, [isSearchActive]);

  const isBlogSection = pathname?.startsWith("/blog") || pathname?.includes("/blog/");
  const activeData = isBlogSection ? blogItems : shopItems;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery;
      setSearchQuery("");
      setIsSearchActive(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const closeSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <div
      className="lg:hidden w-full h-[60px] bg-[#15171e] border-b border-white/5 px-4 flex items-center justify-between relative"
      dir="rtl"
    >
      <div className="flex items-center justify-between w-full h-full">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-10 h-10 text-brand-m_khonsa hover:text-white transition-colors"
          aria-label="باز کردن منو"
          aria-expanded={isOpen}
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>

        <Link href="/" className="flex items-center justify-center" aria-label="صفحه اصلی">
          <Image
            src="/images/arena2battleLogo.webp"
            alt="Arena 2 Battle"
            width={100}
            height={30}
            className="h-[30px] w-auto object-contain"
            priority
            style={{ width: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-1 h-full">
          <Suspense fallback={<Skeleton className="w-6 h-4 rounded-[2px]" />}>
            <MobileRegionSwitcher regions={regions} initialRegion={activeRegion} />
          </Suspense>

          <button
            onClick={() => setIsSearchActive(true)}
            className="flex items-center justify-center w-10 h-10 text-brand-m_khonsa hover:text-white transition-colors"
            aria-label="جستجو"
          >
            <Search size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {isSearchActive && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeSearch}
          aria-hidden="true"
        />
      )}

      <div
        className="absolute inset-0 bg-[#15171e] z-50 px-4 flex items-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{
          clipPath: isSearchActive
            ? "circle(150% at 20% 50%)"
            : "circle(0% at 20% 50%)",
          pointerEvents: isSearchActive ? "auto" : "none",
        }}
        aria-hidden={!isSearchActive}
      >
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex items-center w-full h-11 bg-brand-surface rounded-md overflow-hidden px-3 border border-white/5"
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="نام محصول یا بازی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent text-sm text-white outline-none placeholder:text-brand-m_khonsa/50 pl-8 text-right"
            aria-label="جستجو"
          />
          <div className="absolute left-3 flex items-center gap-2">
            {isPending ? (
              <span className="w-4 h-4 border-2 border-transparent border-t-brand-blue rounded-full animate-spin" />
            ) : (
              <button type="submit" aria-label="جستجو">
                <Search
                  size={16}
                  strokeWidth={2.5}
                  className="text-brand-m_khonsa hover:text-white"
                />
              </button>
            )}
            <button
              type="button"
              onClick={closeSearch}
              className="text-brand-m_khonsa hover:text-white transition-colors p-1"
              aria-label="بستن جستجو"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </form>

        {isSearchActive && (searchQuery || searchResults.length > 0 || isPending) && (
          <div className="absolute top-[60px] right-0 w-full bg-[#15171e] border-b border-brand-surface p-3 max-h-[calc(100vh-60px)] overflow-y-auto flex flex-col gap-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-50">
            <div className="text-[13px] text-brand-m_khonsa border-b border-white/5 pb-2 mb-1 px-1 font-bold">
              نتایج سریع محصولات
            </div>

            {isPending ? (
              <div className="flex flex-col gap-2 p-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[68px] w-full" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {searchResults.map((prod) => (
                  <div key={prod.id} onClick={closeSearch}>
                    <MiniSearchCard product={prod} activeRegion={currentRegion} />
                  </div>
                ))}
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  onClick={closeSearch}
                  className="block text-center bg-brand-surface hover:bg-brand-surface_hover text-white text-[13px] font-bold w-full p-2.5 rounded border border-white/5 transition-colors mt-2"
                >
                  مشاهده همه نتایج جستجو
                </Link>
              </>
            ) : searchQuery ? (
              <div className="py-6 text-center text-xs text-brand-m_khonsa">
                محصولی با این مشخصات یافت نشد.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999]"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[300px] bg-brand-bg border-l border-brand-surface z-[100000] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="منوی ناوبری"
      >
        <div className="flex items-center justify-between h-[60px] px-5 border-b border-brand-surface shrink-0">
          <span className="text-white font-bold text-base">منوی سایت</span>
          <button
            onClick={closeMenu}
            className="text-brand-m_khonsa hover:text-white transition-colors"
            aria-label="بستن منو"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        <Link
          href="/my-account"
          onClick={closeMenu}
          className="flex items-center gap-3 px-5 py-4 border-b border-brand-surface shrink-0 hover:bg-white/5 transition-colors"
        >
          {user ? (
            <>
              <UserAvatar src={user.avatarUrl} name={user.name} size="md" ring />
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-sm truncate">{user.name}</span>
                <span className="text-brand-m_khonsa text-xs">مشاهده حساب کاربری</span>
              </div>
            </>
          ) : (
            <>
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 text-brand-m_khonsa shrink-0">
                <User size={20} strokeWidth={2.5} />
              </span>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">ورود / عضویت</span>
                <span className="text-brand-m_khonsa text-xs">برای پیگیری سفارشات وارد شوید</span>
              </div>
            </>
          )}
          <ChevronLeft size={16} className="text-brand-m_khonsa mr-auto shrink-0" />
        </Link>

        <div className="flex-1 overflow-y-auto flex flex-col">
          <nav className="flex flex-col text-right w-full">
            <Link
              href={`/${currentRegion}`}
              onClick={closeMenu}
              className={`p-4 text-sm font-bold border-b border-brand-surface transition-colors ${
                !isBlogSection
                  ? "text-brand-blue bg-brand-surface/20"
                  : "text-brand-white hover:bg-brand-surface/30"
              }`}
            >
              فروشگاه
            </Link>
            <Link
              href={`/${currentRegion}/blog`}
              onClick={closeMenu}
              className={`p-4 text-sm font-bold border-b border-brand-surface transition-colors ${
                isBlogSection
                  ? "text-brand-blue bg-brand-surface/20"
                  : "text-brand-white hover:bg-brand-surface/30"
              }`}
            >
              بلاگ اخبار
            </Link>

            <div className="flex flex-col w-full">
              <button
                onClick={() => setShopOpen((prev) => !prev)}
                className="flex items-center justify-between p-4 text-sm font-bold text-brand-white hover:bg-brand-surface/30 transition-colors border-b border-brand-surface bg-transparent outline-none"
                aria-expanded={shopOpen}
              >
                {isBlogSection ? "دسته‌بندی‌های اخبار" : "بازی‌ها"}
                <ChevronDown
                  size={14}
                  strokeWidth={3}
                  className={`transition-transform duration-200 ${shopOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`grid grid-cols-4 gap-2 bg-[#111215] border-t border-[#23252b] transition-all overflow-hidden ${
                  shopOpen ? "max-h-[500px] p-2.5 opacity-100" : "max-h-0 p-0 opacity-0"
                }`}
              >
                {activeData.map((item, i) => (
                  <Link
                    key={i}
                    href={buildHref(item.link)}
                    onClick={closeMenu}
                    onMouseEnter={() => router.prefetch(buildHref(item.link))}
                    className="flex items-center justify-center p-2 rounded hover:bg-white/5"
                    aria-label={item.title}
                  >
                    <div className="relative w-10 h-10">
                      <Image
                        src={item.img}
                        alt={item.title || "game"}
                        fill
                        sizes="40px"
                        className="object-contain"
                        quality={70}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-[#23252b]" />
          </nav>
        </div>
      </div>
    </div>
  );
}