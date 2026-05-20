"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MiniSearchCard from "./MiniSearchCard";
import { useProductSearch } from "./hooks/useProductSearch";

export default function HeaderSearch() {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const { searchQuery, setSearchQuery, searchResults, isPending } = useProductSearch();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePrefetchAll = () => {
    if (searchQuery.trim()) {
      router.prefetch(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div 
      ref={searchContainerRef}
      className="relative flex-1 max-w-[400px] h-full z-[150] bg-brand-surface border-transparent focus-within:ring-1 focus-within:ring-brand-m_khonsa/60"
    >
      <div className="relative flex items-center h-full w-full">
        <input 
          type="text" 
          placeholder="جستجو در تمام محصولات..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleSearchSubmit}
          className="w-full h-full bg-transparent pr-12 pl-4 text-brand-white text-[14px] font-medium outline-none peer placeholder:text-brand-m_khonsa/70" 
        />
        {isPending ? (
          <span className="absolute right-4 w-4 h-4 border-2 border-transparent border-t-brand-blue rounded-full animate-spin"></span>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute right-4 text-[#888] pointer-events-none peer-focus:text-[#0074E1] transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        )}
        
        {showResults && searchQuery.trim() !== "" && (
          <div className="absolute top-[68px] left-0 w-full bg-brand-bg transition-all duration-200 border border-brand-surface_hover p-2.5 shadow-[0_15px_30px_rgba(0,0,0,0.6)] z-[160] overflow-hidden">
            <div className="text-[13px] text-brand-m_khonsa border-b border-brand-surface pb-2 mb-2 px-1 font-bold">نتایج سریع محصولات</div>
            <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto relative">
              {searchResults.length > 0 ? (
                searchResults.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => setShowResults(false)}
                    onMouseEnter={() => router.prefetch(`/product/${prod.slug}`)}
                  >
                    <MiniSearchCard product={prod} />
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[13px] text-brand-m_khonsa">محصولی یافت نشد.</div>
              )}
            </div>
            {searchResults.length > 0 && (
              <Link 
                href={`/search?q=${encodeURIComponent(searchQuery)}`} 
                onClick={() => setShowResults(false)}
                onMouseEnter={handlePrefetchAll}
                onFocus={handlePrefetchAll}
                className="block text-center bg-brand-surface hover:bg-brand-surface_hover transition-colors w-full p-4 mt-2 text-[14px] font-bold text-brand-m_khonsa"
              >
                مشاهده تمامی نتایج
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}