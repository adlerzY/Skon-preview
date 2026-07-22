"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { KNOWN_REGIONS, DEFAULT_REGION } from "@/lib/regions";

export { KNOWN_REGIONS };

function regionFromPathname(pathname: string | null) {
  if (!pathname) return { region: null as string | null, hasRegion: false, pathnameWithoutRegion: "" };
  const segments = pathname.split("/").filter(Boolean);
  const hasRegion = KNOWN_REGIONS.includes(segments[0]?.toLowerCase());
  return {
    region: hasRegion ? segments[0] : null,
    hasRegion,
    pathnameWithoutRegion: hasRegion ? `/${segments.slice(1).join("/")}` : pathname,
  };
}

export function useActiveRegion() {
  const pathname = usePathname();
  const [cookieRegion, setCookieRegion] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)store_region=([^;]+)/);
    const value = match?.[1];
    if (value && KNOWN_REGIONS.includes(value.toLowerCase())) {
      setCookieRegion(value);
    }
  }, [pathname]);

  return useMemo(() => {
    const { region: pathRegion, hasRegion, pathnameWithoutRegion } = regionFromPathname(pathname);
    const region = pathRegion ?? cookieRegion ?? DEFAULT_REGION;
    return {
      region,
      pathnameWithoutRegion: hasRegion ? pathnameWithoutRegion : (pathname ?? ""),
    };
  }, [pathname, cookieRegion]);
}

export function buildRegionHref(region: string, link: string): string {
  const clean = link.startsWith("/") ? link : `/${link}`;
  return `/${region}${clean}`;
}