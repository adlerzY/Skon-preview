"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

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
  const [visibleCount, setVisibleCount] = useState(games?.length || 0);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateItems = useCallback((width: number) => {
    if (!games || games.length === 0) return 0;
    if (width >= games.length * 60) return games.length;
    return Math.max(1, Math.floor((width - 50) / 60));
  }, [games]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !games || games.length === 0) return;

    const initialWidth = containerRef.current.getBoundingClientRect().width || containerRef.current.offsetWidth;
    if (initialWidth > 0) {
      setVisibleCount(calculateItems(initialWidth));
    }

    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      
      rafId = window.requestAnimationFrame(() => {
        if (width > 0) {
          setVisibleCount(calculateItems(width));
        }
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

  const regionInfo = useMemo(() => {
    if (!isMounted || !pathname) return { currentRegion: "eu", pathnameWithoutRegion: pathname };
    const segments = pathname.split("/").filter(Boolean);
    const knownRegions = ["eu", "us", "tr"];
    const hasRegion = knownRegions.includes(segments[0]?.toLowerCase());
    
    let currentRegion = "eu";
    if (hasRegion) {
      currentRegion = segments[0];
    } else if (typeof document !== "undefined") {
      const match = document.cookie.match(new RegExp('(^| )store_region=([^;]+)'));
      if (match && knownRegions.includes(match[2].toLowerCase())) {
        currentRegion = match[2];
      }
    }
    
    const pathnameWithoutRegion = hasRegion 
      ? `/${segments.slice(1).join("/")}` 
      : pathname;
      
    return { currentRegion, pathnameWithoutRegion };
  }, [isMounted, pathname]);

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

  const { currentRegion, pathnameWithoutRegion } = regionInfo;

  return (
    <div className="flex-1 h-full flex items-center contain-inline-size w-full" ref={containerRef}>
      <div className="flex items-center h-full w-full justify-start">
        {visible.map((game) => {
          const cleanLink = game.link.startsWith("/") ? game.link : `/${game.link}`;
          const finalHref = `/${currentRegion}${cleanLink}`;
          const isActive = pathnameWithoutRegion === cleanLink || pathnameWithoutRegion?.startsWith(`${cleanLink}/`);
          
          return (
            <Link
              key={game.link}
              href={finalHref}
              prefetch={false}
              onMouseEnter={() => router.prefetch(finalHref)}
              onFocus={() => router.prefetch(finalHref)}
              className={`flex items-center justify-center w-[60px] h-full transition-all group border-b-[3px] ${
                isActive
                  ? "bg-white/10 border-[#0074E1] opacity-100"
                  : "bg-transparent border-transparent opacity-80 hover:opacity-100 hover:bg-white/5"
              }`}
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
            <button
              aria-label="مشاهده بازی‌های بیشتر"
              className="flex items-center justify-center w-full h-full text-brand-m_khonsa hover:text-white transition-colors border-b-[3px] border-transparent hover:bg-white/5 opacity-80 hover:opacity-100"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
            <div className="absolute top-[60px] right-0 bg-[#15171e] border border-white/5 rounded-lg opacity-0 invisible translate-y-1.5 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 p-3 z-[1000] min-w-[280px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] will-change-transform">
              <div className="grid grid-cols-4 gap-2">
                {hidden.map((game) => {
                  const cleanLink = game.link.startsWith("/") ? game.link : `/${game.link}`;
                  const finalHref = `/${currentRegion}${cleanLink}`;
                  const isActive = pathnameWithoutRegion === cleanLink || pathnameWithoutRegion?.startsWith(`${cleanLink}/`);
                  
                  return (
                    <Link
                      key={game.link}
                      href={finalHref}
                      prefetch={false}
                      onMouseEnter={() => router.prefetch(finalHref)}
                      onFocus={() => router.prefetch(finalHref)}
                      aria-label={game.title}
                      className={`flex items-center justify-center p-2 rounded transition-colors group/game ${
                        isActive ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="relative w-10 h-10 transition-transform duration-300 group-hover/game:scale-110">
                        <Image
                          src={game.img}
                          alt={game.title || "game"}
                          fill
                          sizes="40px"
                          quality={80}
                          className={`object-contain ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""}`}
                        />
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
        {games.map((game) => {
          const cleanLink = game.link.startsWith("/") ? game.link : `/${game.link}`;
          const finalHref = `/${currentRegion}${cleanLink}`;
          return (
            <Link key={`seo-${game.link}`} href={finalHref}>{game.title}</Link>
          );
        })}
      </div>
    </div>
  );
}