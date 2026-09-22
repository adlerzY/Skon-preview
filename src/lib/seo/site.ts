import type { Metadata, Viewport } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://arena2battle.com").replace(/\/+$/, "");
export const SITE_NAME = "Arena2Battle";
export const SITE_NAME_FA = "آرنا2بتل";
export const DEFAULT_SEO_TITLE = "Arena2Battle — فروشگاه گیم";
export const DEFAULT_SEO_DESCRIPTION = "فروشگاه تخصصی بازی، گیفت‌کارت و خدمات گیمینگ با تحویل آنی و پشتیبانی.";
export const DEFAULT_OG_DESCRIPTION = "خرید بازی، گیفت‌کارت و خدمات گیمینگ از Arena2Battle.";
export const SEO_REGION = "eu";

export function selectSeoCategory<T extends { slug?: string | null }>(
  categories?: readonly T[] | null
): T | undefined {
  if (!categories?.length) return undefined;
  return categories.find((category) => category.slug && !["uncategorized", "home"].includes(category.slug)) || categories[0];
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#111215",
};

export function absoluteUrl(path = "/"): string {
  try {
    return new URL(path, `${SITE_URL}/`).toString();
  } catch {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${SITE_URL}${normalized}`;
  }
}

export function stripHtml(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeDescription(value: string | null | undefined, fallback = DEFAULT_SEO_DESCRIPTION): string {
  const cleaned = stripHtml(value);
  if (!cleaned) return fallback;
  if (cleaned.length <= 160) return cleaned;
  return `${cleaned.slice(0, 157).trimEnd()}...`;
}

export function makeMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
}: {
  title: string;
  description?: string | null;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title.includes("Arena2Battle") ? title : `${title} | ${SITE_NAME}`;
  const canonical = path ? absoluteUrl(path) : undefined;
  const resolvedDescription = makeDescription(description, DEFAULT_SEO_DESCRIPTION);
  const resolvedImage = image ? absoluteUrl(image) : null;

  return {
    title: fullTitle,
    description: resolvedDescription,
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true },
        },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: SITE_NAME,
      title: fullTitle,
      description: resolvedDescription,
      ...(canonical ? { url: canonical } : {}),
      ...(resolvedImage ? { images: [{ url: resolvedImage }] } : {}),
    },
    twitter: {
      card: resolvedImage ? "summary_large_image" : "summary",
      title: fullTitle,
      description: resolvedDescription,
      ...(resolvedImage ? { images: [resolvedImage] } : {}),
    },
  };
}
