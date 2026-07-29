"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { KNOWN_REGIONS } from "@/lib/hooks/useActiveRegion";

interface Region {
  name: string;
  slug: string;
  flagUrl?: string;
}

interface MobileRegionSwitcherProps {
  regions: Region[];
  initialRegion: string;
}

export default function MobileRegionSwitcher({ regions, initialRegion }: MobileRegionSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const activeRegions = regions.length > 0 ? regions : [
    { slug: "eu", name: "اروپا (EU)" },
    { slug: "us", name: "آمریکا (US)" },
  ];

  const segments = pathname ? pathname.split("/").filter(Boolean) : [];
  const firstSegmentIsRegion = KNOWN_REGIONS.includes(segments[0]?.toLowerCase());
  const currentRegionSlug = firstSegmentIsRegion ? segments[0] : initialRegion || activeRegions[0]?.slug;
  const currentRegion = activeRegions.find((r) => r.slug === currentRegionSlug) || activeRegions[0];

  if (!currentRegion) return null;

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    if (slug === currentRegionSlug) return;

    document.cookie = `store_region=${slug}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    let newPathname: string;
    if (firstSegmentIsRegion) {
      const updated = [...segments];
      updated[0] = slug;
      newPathname = "/" + updated.join("/");
    } else {
      newPathname = `/${slug}${pathname === "/" ? "" : pathname}`;
    }

    const query = searchParams.toString();
    router.push(query ? `${newPathname}?${query}` : newPathname);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 shrink-0"
        aria-label={`تغییر ریجن — ${currentRegion.name}`}
      >
        {currentRegion.flagUrl ? (
          <div className="relative w-6 h-4 overflow-hidden rounded-[2px] border border-white/10">
            <Image src={currentRegion.flagUrl} alt={currentRegion.name} fill className="object-cover" sizes="24px" />
          </div>
        ) : (
          <div className="w-6 h-4 rounded-[2px] bg-brand-surface border border-white/10" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100002]" role="dialog" aria-modal="true" aria-label="انتخاب ریجن">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 inset-x-0 bg-brand-menu border-t border-white/10 rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold text-sm">انتخاب ریجن</span>
              <button onClick={() => setIsOpen(false)} className="text-brand-m_khonsa hover:text-white transition-colors" aria-label="بستن">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {activeRegions.map((region) => (
                <button
                  key={region.slug}
                  type="button"
                  onClick={() => handleSelect(region.slug)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-right transition-colors ${
                    region.slug === currentRegionSlug ? "bg-brand-blue/10 border border-brand-blue/30" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {region.flagUrl ? (
                    <div className="relative w-7 h-5 overflow-hidden rounded-[2px] shrink-0">
                      <Image src={region.flagUrl} alt={region.name} fill className="object-cover" sizes="28px" />
                    </div>
                  ) : (
                    <div className="w-7 h-5 rounded-[2px] bg-brand-surface shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${region.slug === currentRegionSlug ? "text-white font-bold" : "text-white/80 font-medium"}`}>
                    {region.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}