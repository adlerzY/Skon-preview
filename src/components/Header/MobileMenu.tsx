"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { GAMES_DATA } from "@/constants/games";
import { useProductSearch } from "./hooks/useProductSearch";
import MiniSearchCard from "./MiniSearchCard";

export default function MobileMenu({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { searchQuery, setSearchQuery, searchResults, isPending } = useProductSearch();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; }
  }, [isOpen]);

  const activeStore = pathname === "/" || pathname === "/shop";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery;
      setSearchQuery(""); 
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="lg:hidden h-full flex items-center">
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center justify-center w-[60px] h-full text-brand-m_khonsa hover:text-white transition-colors"
        aria-label="Open Menu"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed top-0 right-0 h-full w-[300px] bg-brand-bg border-l border-brand-surface z-[100000] flex flex-col transition-transform duration-300 ease-in-out will-change-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between h-[60px] px-5 border-b border-brand-surface">
          <span className="text-white font-bold text-base">منوی سایت</span>
          <button onClick={() => setIsOpen(false)} className="text-brand-m_khonsa hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-4 border-b border-brand-surface bg-[#111215]">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-10 bg-brand-surface rounded overflow-hidden px-3">
            <input 
              type="text" 
              placeholder="جستجو در محصولات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent text-sm text-white outline-none placeholder:text-brand-m_khonsa/60"
            />
            {isPending ? (
              <span className="w-4 h-4 border-2 border-transparent border-t-brand-blue rounded-full animate-spin shrink-0"></span>
            ) : (
              <button type="submit" aria-label="Search">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-m_khonsa"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
            )}
          </form>

          {searchQuery.trim() !== "" && (
            <div className="mt-2 bg-brand-bg border border-brand-surface rounded p-2 max-h-[240px] overflow-y-auto flex flex-col gap-1.5 custom-scrollbar">
              {searchResults.length > 0 ? (
                searchResults.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => {
                      setSearchQuery("");
                      setIsOpen(false);
                    }}
                    onTouchStart={() => router.prefetch(`/product/${prod.slug}`)}
                  >
                    <MiniSearchCard product={prod} />
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-brand-m_khonsa">محصولی یافت نشد.</div>
              )}
            </div>
          )}
        </div>

        <nav className="flex flex-col text-right">
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
        
        <div className="mt-auto p-5">
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