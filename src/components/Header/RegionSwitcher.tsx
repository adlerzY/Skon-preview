"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Region {
  name: string;
  slug: string;
  flagUrl?: string;
}

interface RegionSwitcherProps {
  regions: Region[];
  initialRegion: string;
}

export default function RegionSwitcher({ regions, initialRegion }: RegionSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRegions = regions.length > 0 ? regions : [
    { slug: "eu", name: "اروپا (EU)" },
    { slug: "us", name: "آمریکا (US)" }
  ];

  const segments = pathname.split("/").filter(Boolean);
  const firstSegmentIsRegion = activeRegions.some((r) => r.slug === segments[0]);
  
  const currentRegionSlug = firstSegmentIsRegion 
    ? segments[0] 
    : (initialRegion || activeRegions[0]?.slug);
    
  const currentRegion = activeRegions.find((r) => r.slug === currentRegionSlug) || activeRegions[0];

  const handleRegionChange = (slug: string) => {
    if (slug === currentRegionSlug) {
      setIsOpen(false);
      return;
    }

    document.cookie = `store_region=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    
    let newPathname = "";
    const updatedSegments = [...segments];

    if (firstSegmentIsRegion) {
      updatedSegments[0] = slug;
      newPathname = "/" + updatedSegments.join("/");
    } else {
      newPathname = `/${slug}${pathname === "/" ? "" : pathname}`;
    }

    const currentQueries = searchParams.toString();
    const targetUrl = currentQueries ? `${newPathname}?${currentQueries}` : newPathname;

    router.push(targetUrl);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentRegion) return null;

  return (
    <div 
      className="relative h-full flex items-center" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="flex items-center justify-between gap-2 px-3 h-[60px] w-[140px] bg-brand-surface hover:bg-brand-surface_hover text-white text-[13px] font-semibold transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {currentRegion.flagUrl && (
            <div className="relative w-5 h-3.5 overflow-hidden rounded-[2px] shrink-0">
              <Image
                src={currentRegion.flagUrl}
                alt={currentRegion.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <span className="truncate">{currentRegion.name}</span>
        </div>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div 
        className={`absolute left-0 top-[60px] min-w-[140px] bg-brand-surface border border-white/10 rounded-b-[4px] shadow-2xl overflow-hidden z-[1000] transition-all duration-200 ease-in-out ${
          isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
        }`}
      >
        {activeRegions.map((region) => (
          <button
            key={region.slug}
            onClick={() => handleRegionChange(region.slug)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-right text-[12px] font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors cursor-pointer ${
              region.slug === currentRegionSlug ? "bg-white/5 !text-brand-white font-bold" : ""
            }`}
          >
            {region.flagUrl && (
              <div className="relative w-5 h-3.5 overflow-hidden rounded-[2px] shrink-0">
                <Image
                  src={region.flagUrl}
                  alt={region.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span className="truncate">{region.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}