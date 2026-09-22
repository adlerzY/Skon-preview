import { absoluteUrl, SITE_NAME, SITE_NAME_FA, stripHtml } from "./site";
import type { ProductNode } from "@/lib/graphql";

export function websiteSchema() {
  const siteUrl = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: SITE_NAME,
    alternateName: SITE_NAME_FA,
    description: "فروشگاه تخصصی بازی، گیفت‌کارت و خدمات گیمینگ برای گیمرهای ایرانی.",
    inLanguage: "fa-IR",
  };
}

export function organizationSchema() {
  const siteUrl = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: SITE_NAME,
    alternateName: SITE_NAME_FA,
    url: siteUrl,
    logo: absoluteUrl("/images/arena2battleLogo.webp"),
    description: "فروشگاه تخصصی بازی، گیفت‌کارت و خدمات گیمینگ برای گیمرهای ایرانی.",
    sameAs: ["https://t.me/Arena2BattleSupport"],
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

function tomanToIrr(value: number): string {
  return String(Math.max(0, Math.round(value * 10)));
}

export function productSchema(product: ProductNode, canonicalPath: string) {
  const imageUrls = [product.imageLarge?.sourceUrl, product.image?.sourceUrl, ...(product.galleryImages?.nodes ?? []).map((item) => item.sourceUrl)]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
    .slice(0, 8);
  const description = stripHtml(product.shortDescription || product.description || product.name);
  const offers = typeof product.parsedPrice === "number"
    ? {
        "@type": "Offer",
        url: absoluteUrl(canonicalPath),
        priceCurrency: "IRR",
        price: tomanToIrr(product.parsedPrice),
        availability: product.isAvailableInRegion === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: SITE_NAME,
          url: absoluteUrl("/"),
        },
      }
    : undefined;

  const ratingValue = typeof product.averageRating === "number" ? product.averageRating : null;
  const reviewCount = typeof product.reviewCount === "number" ? product.reviewCount : 0;
  const aggregateRating = ratingValue !== null && reviewCount > 0 && ratingValue >= 1 && ratingValue <= 5
    ? {
        "@type": "AggregateRating",
        ratingValue,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(canonicalPath)}#product`,
    name: product.name,
    description: description.slice(0, 5000),
    url: absoluteUrl(canonicalPath),
    ...(imageUrls.length ? { image: imageUrls } : {}),
    ...(offers ? { offers } : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
  };
}

export function articleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  authorName,
  dateModified,
}: {
  title: string;
  description?: string;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(url)}#article`,
    headline: title,
    description: description || title,
    url: absoluteUrl(url),
    ...(image ? { image: [absoluteUrl(image)] } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/arena2battleLogo.webp"),
      },
    },
    inLanguage: "fa-IR",
  };
}
