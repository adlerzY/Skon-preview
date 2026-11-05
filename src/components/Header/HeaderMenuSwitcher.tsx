"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DesktopGamesNav, { HeaderGameItem } from "./DesktopGamesNav";

interface HeaderMenuSwitcherProps {
  shopItems: HeaderGameItem[];
  blogItems: HeaderGameItem[];
}

interface NavigationData {
  shopItems: HeaderGameItem[];
  blogItems: HeaderGameItem[];
}

export default function HeaderMenuSwitcher({ shopItems, blogItems }: HeaderMenuSwitcherProps) {
  const pathname = usePathname();
  const serverEmpty = shopItems.length === 0 && blogItems.length === 0;
  const [fallback, setFallback] = useState<NavigationData | null>(null);
  const [fallbackSettled, setFallbackSettled] = useState(!serverEmpty);

  useEffect(() => {
    if (!serverEmpty) return;
    let cancelled = false;

    fetch("/api/header/navigation", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFallback({
          shopItems: Array.isArray(data.shopItems) ? data.shopItems : [],
          blogItems: Array.isArray(data.blogItems) ? data.blogItems : [],
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFallbackSettled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [serverEmpty]);

  const segments = pathname ? pathname.split("/").filter(Boolean) : [];
  const isBlogSection = segments[0] === "blog" || segments[1] === "blog";

  const source = serverEmpty && fallback ? fallback : { shopItems, blogItems };
  const activeData = isBlogSection ? source.blogItems : source.shopItems;

  return (
    <div className="flex-1 h-full transition-all duration-500 ease-in-out">
      <DesktopGamesNav key={isBlogSection ? "blog" : "shop"} games={activeData} pending={!fallbackSettled} />
    </div>
  );
}