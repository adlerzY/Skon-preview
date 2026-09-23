"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildRegionHref } from "@/lib/hooks/useActiveRegion";

export interface StorefrontActiveGame {
  title: string;
  img: string;
  link: string;
}

type StorefrontGameItem = StorefrontActiveGame;

interface StorefrontContextBarClientProps {
  region: string;
  activeGame?: StorefrontActiveGame | null;
  children: ReactNode;
}

function normalizePath(path?: string | null): string {
  if (!path) return "";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export default function StorefrontContextBarClient({
  region,
  activeGame,
  children,
}: StorefrontContextBarClientProps) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [gameItems, setGameItems] = useState<StorefrontGameItem[] | null>(null);
  const [gameItemsLoading, setGameItemsLoading] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isStuck) setGameMenuOpen(false);
  }, [isStuck]);

  const loadGameItems = () => {
    if (gameItems || gameItemsLoading) return;
    setGameItemsLoading(true);
    fetch("/api/header/games", {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("header navigation request failed");
        return (await response.json()) as { games?: StorefrontGameItem[] };
      })
      .then((data) => {
        setGameItems(Array.isArray(data.games) ? data.games : []);
      })
      .catch(() => setGameItems([]))
      .finally(() => setGameItemsLoading(false));
  };

  const openGameMenu = () => {
    setGameMenuOpen((current) => !current);
    loadGameItems();
  };

  if (!children && !activeGame) return null;

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
      <div
        data-stuck={isStuck ? "true" : "false"}
        className="storefront-context-bar sticky top-0 z-[9000] w-full bg-brand-bg border-y border-brand-surface_hover shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
      >
        <div className="w-full max-w-site mx-auto min-h-[52px] flex items-center gap-3 overflow-visible">
          {isStuck && activeGame ? (
            <div
              className="relative shrink-0 group"
              onMouseLeave={() => setGameMenuOpen(false)}
            >
              <button
                type="button"
                aria-label={`انتخاب بازی: ${activeGame.title}`}
                aria-expanded={gameMenuOpen}
                onClick={openGameMenu}
                onMouseEnter={() => {
                  loadGameItems();
                  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                    setGameMenuOpen(true);
                  }
                }}
                onFocus={loadGameItems}
                className="flex h-[52px] w-[58px] items-center justify-center border-l border-brand-surface_hover bg-brand-surface hover:bg-brand-surface_hover transition-colors"
              >
                <span className="relative w-8 h-8">
                  <Image
                    src={activeGame.img}
                    alt={activeGame.title}
                    fill
                    sizes="32px"
                    quality={75}
                    className="object-contain"
                  />
                </span>
                <ChevronDown size={12} className="mr-1 text-brand-m_khonsa" aria-hidden="true" />
              </button>

              <div
                className={`absolute right-0 top-[56px] min-w-[230px] rounded-[5px] border border-brand-surface_hover bg-brand-surface p-2 shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-[opacity,transform,visibility] duration-150 ${
                  gameMenuOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible translate-y-1.5 opacity-0"
                }`}
              >
                {gameItemsLoading && !gameItems ? (
                  <div className="grid grid-cols-4 gap-1 p-1" aria-busy="true">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-12 rounded-[4px] bg-white/[.035]" />
                    ))}
                  </div>
                ) : gameItems && gameItems.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1">
                    {gameItems.map((game) => {
                      const href = buildRegionHref(region, game.link);
                      const active = normalizePath(game.link) === normalizePath(activeGame.link);
                      return (
                        <Link
                          key={game.link}
                          href={href}
                          prefetch={false}
                          onMouseEnter={() => router.prefetch(href)}
                          onFocus={() => router.prefetch(href)}
                          onClick={() => setGameMenuOpen(false)}
                          aria-label={game.title}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center justify-center rounded-[4px] p-2 transition-colors ${active ? "bg-white/10" : "hover:bg-white/5"}`}
                        >
                          <span className="relative w-9 h-9">
                            <Image
                              src={game.img}
                              alt={game.title}
                              fill
                              sizes="36px"
                              quality={70}
                              className="object-contain"
                            />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-xs text-brand-m_khonsa">بازی دیگری در دسترس نیست.</div>
                )}
              </div>
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </>
  );
}
