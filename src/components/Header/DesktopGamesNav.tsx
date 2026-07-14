"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";
import { useActiveRegion, buildRegionHref } from "@/lib/hooks/useActiveRegion";

export interface HeaderGameItem {
  title: string;
  img: string;
  link: string;
}

interface DesktopGamesNavProps {
  games: HeaderGameItem[];
}

const ITEM_WIDTH = 60;
const OVERFLOW_BUTTON_WIDTH = 50;

export default function DesktopGamesNav({ games }: DesktopGamesNavProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(games?.length ?? 0);
  const [isMounted, setIsMounted] = useState(false);
  const { region: currentRegion, pathnameWithoutRegion } = useActiveRegion();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calculateItems = useCallback(
    (width: number): number => {
      if (!games || games.length === 0) return 0;
      if (width >= games.length * ITEM_WIDTH) return games.length;
      return Math.max(1, Math.floor((width - OVERFLOW_BUTTON_WIDTH) / ITEM_WIDTH));
    },
    [games]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !games?.length) return;

    const initialWidth = el.getBoundingClientRect().width || el.offsetWidth;
    if (initialWidth > 0) setVisibleCount(calculateItems(initialWidth));

    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { width } = entry.contentRect;
        if (width > 0) setVisibleCount(calculateItems(width));
      });
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [calculateItems, games]);

  const visible = useMemo(
    () => games?.slice(0, visibleCount) ?? [],
    [games, visibleCount]
  );
  const hidden = useMemo(
    () => games?.slice(visibleCount) ?? [],
    [games, visibleCount]
  );

  if (!isMounted || !games?.length) {
    return (
      <div className="flex items-center gap-2 h-full px-2 w-[240px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-9 h-9" />
        ))}
      </div>
    );
  }

  function buildHref(gameLink: string): string {
    return buildRegionHref(currentRegion, gameLink);
  }

  function isActive(gameLink: string): boolean {
    const clean = gameLink.startsWith("/") ? gameLink : `/${gameLink}`;
    return (
      pathnameWithoutRegion === clean ||
      pathnameWithoutRegion?.startsWith(`${clean}/`)
    );
  }

  function GameIcon({
    game,
    size = 36,
    active,
  }: {
    game: HeaderGameItem;
    size?: number;
    active: boolean;
  }) {
    return (
      <div
        className={`relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
        style={{ width: size, height: size }}
      >
        <Image
          src={game.img}
          alt={game.title || "game"}
          fill
          sizes={`${size}px`}
          quality={80}
          className={`object-contain ${active ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""}`}
        />
      </div>
    );
  }

  return (
    <div
      className="flex-1 h-full flex items-center contain-inline-size w-full"
      ref={containerRef}
    >
      <div className="flex items-center h-full w-full justify-start">
        {visible.map((game) => {
          const href = buildHref(game.link);
          const active = isActive(game.link);
          return (
            <Link
              key={game.link}
              href={href}
              prefetch={false}
              onMouseEnter={() => router.prefetch(href)}
              onFocus={() => router.prefetch(href)}
              className={`flex items-center justify-center w-[60px] h-full transition-all group border-b-[3px] ${
                active
                  ? "bg-white/10 border-[#0074E1] opacity-100"
                  : "bg-transparent border-transparent opacity-80 hover:opacity-100 hover:bg-white/5"
              }`}
              aria-label={game.title}
              aria-current={active ? "page" : undefined}
            >
              <GameIcon game={game} active={active} />
            </Link>
          );
        })}

        {hidden.length > 0 && (
          <div className="relative group flex items-center h-full w-[50px]">
            <button
              aria-label={`مشاهده ${hidden.length} بازی دیگر`}
              aria-haspopup="true"
              className="flex items-center justify-center w-full h-full text-brand-m_khonsa hover:text-white transition-colors border-b-[3px] border-transparent hover:bg-white/5 opacity-80 hover:opacity-100"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
            <div className="absolute top-[60px] right-0 bg-[#15171e] border border-white/5 rounded-lg opacity-0 invisible translate-y-1.5 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 p-3 z-[1000] min-w-[280px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] will-change-transform">
              <div className="grid grid-cols-4 gap-2">
                {hidden.map((game) => {
                  const href = buildHref(game.link);
                  const active = isActive(game.link);
                  return (
                    <Link
                      key={game.link}
                      href={href}
                      prefetch={false}
                      onMouseEnter={() => router.prefetch(href)}
                      aria-label={game.title}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-center p-2 rounded transition-colors group/game ${
                        active ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <GameIcon game={game} size={40} active={active} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <nav className="sr-only" aria-label="همه بازی‌ها">
        {games.map((game) => (
          <Link key={`seo-${game.link}`} href={buildHref(game.link)}>
            {game.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}