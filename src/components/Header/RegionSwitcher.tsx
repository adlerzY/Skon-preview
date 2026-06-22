"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Region {
  name: string;
  slug: string;
  flagUrl?: string;
}

export default function RegionSwitcher({ regions }: { regions: Region[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRegions = regions.length > 0 ? regions : [
    { slug: "eu", name: "اروپا (EU)" },
    { slug: "us", name: "آمریکا (US)" }
  ];

  const currentRegionSlug = searchParams.get("region") || activeRegions[0]?.slug;
  const currentRegion = activeRegions.find((r) => r.slug === currentRegionSlug) || activeRegions[0];

  const handleRegionChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("region", slug);
    
    document.cookie = `store_region=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    
    router.push(`${pathname}?${params.toString()}`);
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 h-[60px] bg-brand-surface hover:bg-brand-surface_hover text-white text-[13px] font-semibold transition-colors duration-150 cursor-pointer"
      >
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
        <span>{currentRegion.name}</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 min-w-[150px] bg-brand-surface border border-white/10 rounded-[4px] shadow-2xl overflow-hidden z-[1000]">
          {activeRegions.map((region) => (
            <button
              key={region.slug}
              onClick={() => handleRegionChange(region.slug)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-right text-[12px] font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors cursor-pointer ${
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
              <span>{region.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}