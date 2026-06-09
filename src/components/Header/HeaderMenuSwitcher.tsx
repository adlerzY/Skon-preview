"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DesktopGamesNav, { HeaderGameItem } from "./DesktopGamesNav";
import Skeleton from "@/components/ui/Skeleton";

interface HeaderMenuSwitcherProps {
  // ✅ type صحیح به جای any[]
  shopItems: HeaderGameItem[];
  blogItems: HeaderGameItem[];
}

export default function HeaderMenuSwitcher({ shopItems, blogItems }: HeaderMenuSwitcherProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex-1 h-full flex items-center gap-2 px-2 w-[240px]">
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-9 h-9" />
        <Skeleton className="w-9 h-9" />
      </div>
    );
  }

  const isBlogSection = pathname?.startsWith("/blog");
  const activeData = isBlogSection ? blogItems : shopItems;

  return (
    <div className="flex-1 h-full transition-all duration-500 ease-in-out">
      <DesktopGamesNav key={isBlogSection ? "blog" : "shop"} games={activeData} />
    </div>
  );
}
