// src/components/Header/SubHeaderBarClient.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const HIDDEN_ROUTES = ["support", "cart"];

export default function SubHeaderBarClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathSegments = pathname.split("/").filter(Boolean);

  const knownRegions = ["eu", "us", "tr"];
  const isOnlyRegion = pathSegments.length === 1 && knownRegions.includes(pathSegments[0].toLowerCase());

  if (pathname === "/" || pathSegments.length === 0 || isOnlyRegion) return null;

  const filteredSegments = knownRegions.includes(pathSegments[0].toLowerCase())
    ? pathSegments.slice(1)
    : pathSegments;

  if (filteredSegments.length === 0) return null;
  if (HIDDEN_ROUTES.includes(filteredSegments[0].toLowerCase())) return null;

  const edition = searchParams.get("edition");

  const getSegmentLabel = (segment: string) => {
    const maps: Record<string, string> = {
      blog: "بلاگ",
      download: "دانلود بازی",
      support: "پشتیبانی",
      "guild-portal": "پورتال گیلد",
    };
    return maps[segment] || decodeURIComponent(segment).replace(/-/g, " ");
  };

  return (
    <div className="w-full" dir="rtl">
      <div className="w-full container mx-auto px-6 max-w-[1600px] h-[40px] flex items-center justify-between">
        <nav className="flex items-center gap-2 text-[13px] font-medium text-white/80">
          <Link href="/" className="hover:text-brand-white transition-colors flex items-center gap-1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </Link>

          {filteredSegments.map((segment, index) => {
            const originalIndex = pathSegments.indexOf(segment);
            const href = `/${pathSegments.slice(0, originalIndex + 1).join("/")}`;
            const isLast = index === filteredSegments.length - 1 && !edition;
            const label = getSegmentLabel(segment);

            return (
              <div key={href} className="flex items-center gap-2">
                <span className="text-white/30 text-[11px] font-bold">/</span>
                {isLast ? (
                  <span className="text-white/60 select-none">{label}</span>
                ) : (
                  <Link href={href} className="hover:text-brand-white transition-colors">
                    {label}
                  </Link>
                )}
              </div>
            );
          })}

          {edition && (
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-[11px] font-bold">/</span>
              <span className="text-white/60 select-none">{decodeURIComponent(edition)}</span>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}