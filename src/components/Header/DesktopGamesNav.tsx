"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";

export interface HeaderGameItem {
  title: string;
  img: string;
  link: string;
}

interface DesktopGamesNavProps {
  games: HeaderGameItem[];
}

export default function DesktopGamesNav({ games }: DesktopGamesNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateItems = useCallback((width: number) => {
    if (!games || games.length === 0) return 0;
    if (width >= games.length * 60) return games.length;
    return Math.max(1, Math.floor((width - 50) / 60));
  }, [games]);

  useEffect(() => {
    setIsMounted(true);
    if (games?.length) {
      setVisibleCount(games.length);
    }
  }, [games]);

  useEffect(() => {
    if (!containerRef.current || !games || games.length === 0) return;
    
    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      rafId = window.requestAnimationFrame(() => {
        setVisibleCount(calculateItems(width));
      });
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [calculateItems, games]);

  const visible = useMemo(() => (games ? games.slice(0, visibleCount) : []), [visibleCount, games]);
  const hidden = useMemo(() => (games ? games.slice(visibleCount) : []), [visibleCount, games]);

  if (!isMounted || !games || games.length === 0) {
    return (
      <div className="flex items-center gap-2 h-full px-2 w-[240px]">
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-9 h-9" />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full px-2 flex items-center contain-inline-size" ref={containerRef}>
      <div className="flex items-center h-full w-full">
        {visible.map((game) => {
          const isActive = pathname === game.link || pathname?.startsWith(`${game.link}/`);
          return (
            <Link
              key={game.link}
              href={game.link}
              prefetch={false}
              onMouseEnter={() => router.prefetch(game.link)}
              onFocus={() => router.prefetch(game.link)}
              className={`flex items-center justify-center w-[60px] h-full transition-all group border-b-[3px] ${isActive ? "bg-white/10 border-[#0074E1] opacity-100" : "bg-transparent border-transparent opacity-80 hover:opacity-100 hover:bg-white/5"}`}
              aria-label={game.title}
            >
              <div className="relative w-9 h-9 pointer-events-none transition-transform duration-300 group-hover:scale-110">
                <Image 
                  src={game.img} 
                  alt={game.title || "game"} 
                  fill 
                  sizes="36px" 
                  quality={80} 
                  className={`object-contain ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""}`} 
                />
              </div>
            </Link>
          );
        })}
        
        {hidden.length > 0 && (
          <div className="relative group flex items-center h-full w-[50px]">
            <button aria-label="مشاهده بازی های بیشتر" className="flex items-center justify-center w-full h-full text-brand-m_khonsa hover:text-white transition-colors border-b-[3px] border-transparent hover:bg-white/5 opacity-80 hover:opacity-100">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <div className="absolute top-[60px] right-0 bg-[#15171e] border border-white/5 rounded-lg opacity-0 invisible translate-y-1.5 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 p-3 z-[1000] min-w-[280px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] will-change-transform">
              <div className="grid grid-cols-4 gap-2">
                {hidden.map((game) => {
                  const isActive = pathname === game.link || pathname?.startsWith(`${game.link}/`);
                  return (
                    <Link 
                      key={game.link} 
                      href={game.link} 
                      prefetch={false} 
                      onMouseEnter={() => router.prefetch(game.link)}
                      onFocus={() => router.prefetch(game.link)}
                      aria-label={game.title} 
                      className={`flex items-center justify-center p-2 rounded transition-colors group/game ${isActive ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      <div className="relative w-10 h-10 transition-transform duration-300 group-hover/game:scale-110">
                        <Image src={game.img} alt={game.title || "game"} fill sizes="40px" quality={80} className={`object-contain ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""}`} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sr-only">
        {games.map((game) => (
          <Link key={`seo-${game.link}`} href={game.link}>
            {game.title}
          </Link>
        ))}
      </div>
    </div>
  );
}