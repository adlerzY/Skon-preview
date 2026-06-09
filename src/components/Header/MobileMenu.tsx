"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { GAMES_DATA } from "@/context/games";
import { useProductSearch } from "./hooks/useProductSearch";
import MiniSearchCard from "./MiniSearchCard";
import { useCart } from "@/context/CartContext";
import Skeleton from "@/components/ui/Skeleton";

export default function MobileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useCart();
  const cartCount = cart.length;
  
  const [isOpen, setIsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery, searchResults, isPending } = useProductSearch();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const activeStore = pathname === "/" || pathname === "/shop";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery;
      setSearchQuery(""); 
      setIsSearchActive(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const closeSearchPanel = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <div className="lg:hidden w-full h-[60px] bg-[#15171e] border-b border-white/5 px-4 flex items-center justify-between relative" dir="rtl">
      
      <div className="flex items-center justify-between w-full h-full">
        <button 
          onClick={() => setIsOpen(true)} 
          className="flex items-center justify-center w-10 h-10 text-brand-m_khonsa hover:text-white transition-colors"
          aria-label="Open Menu"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <Link href="/" className="flex items-center justify-center" aria-label="Home">
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

        <div className="flex items-center gap-0.5 h-full">
          <button 
            onClick={() => setIsSearchActive(true)}
            className="flex items-center justify-center w-10 h-10 text-brand-m_khonsa hover:text-white transition-colors"
            aria-label="Toggle Search"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>

          <Link href="/my-account" className="flex items-center justify-center w-10 h-10 text-brand-m_khonsa hover:text-white transition-colors" aria-label="حساب کاربری">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </Link>
          
          <Link href="/cart" className="flex items-center justify-center w-10 h-10 text-brand-m_khonsa hover:text-white transition-colors relative" aria-label="سبد خرید">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-brand-blue text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </Link>
        </div>
      </div>

      {isSearchActive && (
        <div className="fixed inset-0 z-40" onClick={closeSearchPanel} />
      )}

      <div 
        className="absolute inset-0 bg-[#15171e] z-50 px-4 flex items-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{
          clipPath: isSearchActive 
            ? "circle(150% at 20% 50%)" 
            : "circle(0% at 20% 50%)"
        }}
      >
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-11 bg-brand-surface rounded-md overflow-hidden px-3 border border-white/5">
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="نام محصول یا بازی..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent text-sm text-white outline-none placeholder:text-brand-m_khonsa/50 pl-8 text-right"
          />
          <div className="absolute left-3 flex items-center gap-2">
            {isPending ? (
              <span className="w-4 h-4 border-2 border-transparent border-t-brand-blue rounded-full animate-spin"></span>
            ) : (
              <button type="submit" aria-label="Submit Search">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-m_khonsa hover:text-white"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
            )}
            <button 
              type="button" 
              onClick={closeSearchPanel}
              className="text-brand-m_khonsa hover:text-white transition-colors p-1"
              aria-label="Close Search"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </form>

        {isSearchActive && (searchQuery || searchResults.length > 0 || isPending) && (
          <div className="absolute top-[60px] right-0 w-full bg-[#15171e] border-b border-brand-surface p-3 max-h-[calc(100vh-60px)] overflow-y-auto flex flex-col gap-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-50 custom-scrollbar">
            <div className="text-[13px] text-brand-m_khonsa border-b border-white/5 pb-2 mb-1 px-1 font-bold">نتایج سریع محصولات</div>
            {isPending ? (
              <div className="flex flex-col gap-2 p-1">
                <Skeleton className="h-[68px] w-full" />
                <Skeleton className="h-[68px] w-full" />
                <Skeleton className="h-[68px] w-full" />
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {searchResults.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={closeSearchPanel}
                    onTouchStart={() => router.prefetch(`/product/${prod.slug}`)}
                  >
                    <MiniSearchCard product={prod} />
                  </div>
                ))}
                <Link 
                  href={`/search?q=${encodeURIComponent(searchQuery)}`} 
                  onClick={closeSearchPanel}
                  className="block text-center bg-brand-surface hover:bg-brand-surface_hover text-white text-[13px] font-bold w-full p-2.5 rounded border border-white/5 transition-colors mt-2"
                >
                  مشاهده همه نتایج جستجو
                </Link>
              </>
            ) : searchQuery ? (
              <div className="py-6 text-center text-xs text-brand-m_khonsa">محصولی با این مشخصات یافت نشد.</div>
            ) : null}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999]" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed top-0 right-0 h-full w-[300px] bg-brand-bg border-l border-brand-surface z-[100000] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between h-[60px] px-5 border-b border-brand-surface shrink-0">
          <span className="text-white font-bold text-base">منوی سایت</span>
          <button onClick={() => setIsOpen(false)} className="text-brand-m_khonsa hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <nav className="flex flex-col text-right w-full">
            <Link href="/" onClick={() => setIsOpen(false)} onTouchStart={() => router.prefetch("/")} className={`p-4 text-sm font-bold border-b border-brand-surface transition-colors ${activeStore ? "text-brand-blue bg-brand-surface/20" : "text-brand-white hover:bg-brand-surface/30"}`}>فروشگاه</Link>
            <Link href="/blog" onClick={() => setIsOpen(false)} onTouchStart={() => router.prefetch("/blog")} className={`p-4 text-sm font-bold border-b border-brand-surface transition-colors ${pathname?.startsWith("/blog") ? "text-brand-blue bg-brand-surface/20" : "text-brand-white hover:bg-brand-surface/30"}`}>بلاگ اخبار</Link>
            
            <div className="flex flex-col w-full">
              <button onClick={() => setShopOpen(!shopOpen)} className="flex items-center justify-between p-4 text-sm font-bold text-brand-white hover:bg-brand-surface/30 transition-colors border-b border-brand-surface bg-transparent outline-none">
                بازی‌ها
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${shopOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"></path></svg>
              </button>
              <div className={`grid grid-cols-4 gap-2 bg-[#111215] border-t border-[#23252b] transition-all overflow-hidden ${shopOpen ? "max-h-[500px] p-2.5 opacity-100" : "max-h-0 p-0 opacity-0"}`}>
                {GAMES_DATA.map((game, i) => (
                  <Link 
                    key={i} 
                    href={game.link} 
                    onClick={() => setIsOpen(false)} 
                    onTouchStart={() => router.prefetch(game.link)}
                    onMouseEnter={() => router.prefetch(game.link)}
                    className="flex items-center justify-center p-2 rounded hover:bg-white/5" 
                    aria-label={game.title}
                  >
                    <div className="relative w-10 h-10">
                      <Image src={game.img} alt={game.title || "game"} fill sizes="40px" className="object-contain" quality={70} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-[#23252b]" />
          </nav>
        </div>
        
        <div className="p-5 border-t border-brand-surface bg-[#111215] shrink-0">
           <Link 
             href="/cart" 
             onClick={() => setIsOpen(false)}
             onTouchStart={() => router.prefetch("/cart")}
             className="flex items-center justify-center gap-2.5 w-full bg-brand-surface hover:bg-brand-surface_hover text-white py-3 rounded-md text-sm font-bold border border-white/5 transition-colors relative"
           >
             <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
             <span>سبد خرید شما</span>
             {cartCount > 0 && (
               <span className="bg-brand-blue text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
             )}
           </Link>
        </div>
      </div>
    </div>
  );
}