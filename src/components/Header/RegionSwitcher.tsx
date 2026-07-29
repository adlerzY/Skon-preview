"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
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

  const activeRegions = regions.length > 0 ? regions : [
    { slug: "eu", name: "اروپا (EU)" },
    { slug: "us", name: "آمریکا (US)" }
  ];

  const segments = pathname ? pathname.split("/").filter(Boolean) : [];
  const firstSegmentIsRegion = activeRegions.some((r) => r.slug === segments[0]);

  if (!firstSegmentIsRegion) {
    return (
      <Link
        href="/"
        className="flex items-center justify-center h-[60px] w-[140px] bg-brand-surface hover:bg-brand-surface_hover transition-colors rounded-[5px]"
        aria-label="بازگشت به فروشگاه"
      >
        <Image
          src="/images/arena2battleLogo.webp"
          alt="Arena2Battle"
          width={90}
          height={36}
          style={{ width: "auto" }}
          className="h-9 w-auto object-contain opacity-90"
        />
      </Link>
    );
  }
  
  const currentRegionSlug = segments[0] || initialRegion || activeRegions[0]?.slug;
  const currentRegion = activeRegions.find((r) => r.slug === currentRegionSlug) || activeRegions[0];

  const handleRegionChange = (slug: string) => {
    if (slug === currentRegionSlug) return;

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
  };

  if (!currentRegion) return null;

  return (
    <div className="relative h-full flex items-center group">
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
          className="transition-transform duration-200 shrink-0 group-hover:rotate-180"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div className="absolute left-0 top-[60px] min-w-[140px] bg-brand-surface border border-white/10 rounded-b-[4px] shadow-2xl overflow-hidden z-[1000] transition-all duration-200 ease-in-out opacity-0 invisible -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
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