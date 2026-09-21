export const REGION_REGISTRY = {
  eu: { currency: "EUR", symbol: "€", aliases: ["eu", "eu-global", "اروپا", "europe"] },
  us: { currency: "USD", symbol: "$", aliases: ["us", "امریکا", "آمریکا", "america", "usa"] },
  tr: { currency: "TRY", symbol: "₺", aliases: ["tr", "ترکیه", "turkey"] },
  ua: { currency: "UAH", symbol: "₴", aliases: ["ua", "اوکراین", "ukraine"] },
} as const;

export const REGION_ALIASES: Record<string, readonly string[]> = {
  eu: REGION_REGISTRY.eu.aliases,
  us: REGION_REGISTRY.us.aliases,
  tr: REGION_REGISTRY.tr.aliases,
  ua: REGION_REGISTRY.ua.aliases,
};

export const KNOWN_REGIONS = Object.keys(REGION_REGISTRY);
export const DEFAULT_REGION = "eu";

export function normalizeRegionToken(value?: string | null): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();

  for (const [canonical, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
      return canonical;
    }
  }

  return normalized;
}

export function regionsMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizeRegionToken(a) === normalizeRegionToken(b);
}

export function isKnownRegion(value?: string | null): value is string {
  return !!value && KNOWN_REGIONS.includes(value.toLowerCase());
}
