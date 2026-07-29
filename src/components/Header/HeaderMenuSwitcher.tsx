"use client";

import { usePathname } from "next/navigation";
import DesktopGamesNav, { HeaderGameItem } from "./DesktopGamesNav";

interface HeaderMenuSwitcherProps {
  shopItems: HeaderGameItem[];
  blogItems: HeaderGameItem[];
}

export default function HeaderMenuSwitcher({ shopItems, blogItems }: HeaderMenuSwitcherProps) {
  const pathname = usePathname();
  const segments = pathname ? pathname.split("/").filter(Boolean) : [];
  const isBlogSection = segments[0] === "blog" || segments[1] === "blog";

  const activeData = isBlogSection ? blogItems : shopItems;

  return (
    <div className="flex-1 h-full transition-all duration-500 ease-in-out">
      <DesktopGamesNav key={isBlogSection ? "blog" : "shop"} games={activeData} />
    </div>
  );
}