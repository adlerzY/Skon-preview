"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_CLASSES = "h-[45px] flex items-center px-2 text-[15px] font-semibold transition-colors border-b-[3px]";

interface DesktopNavLinksProps {
  activeRegion: string;
}

export default function DesktopNavLinks({ activeRegion }: DesktopNavLinksProps) {
  const pathname = usePathname();
  const isBlogActive = pathname ? /\/blog(\/|$)/.test(pathname) : false;
  const isShopActive = !isBlogActive;

  return (
    <nav className="flex items-center h-full gap-6">
      <Link 
        href={`/${activeRegion}`} 
        className={`${NAV_CLASSES} ${isShopActive ? "border-brand-blue rounded-none text-white" : "border-transparent text-brand-m_khonsa hover:text-white"}`}
      >
        فروشگاه
      </Link>
      <Link 
        href={`/${activeRegion}/blog`} 
        className={`${NAV_CLASSES} ${isBlogActive ? "border-brand-blue rounded-none text-white" : "border-transparent text-brand-m_khonsa hover:text-white"}`}
      >
        اخبار
      </Link>
    </nav>
  );
}