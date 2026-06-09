const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://tazavesh.local/graphql';

// پارسر اختصاصی قیمت‌های ووکامرس و تبدیل اعداد فارسی/عربی به دیتای عددی خالص
export const parsePrice = (priceString?: string | null): number | null => {
  if (!priceString) return null;
  const splitString = String(priceString).split(/[-–—]|&ndash;/)[0];
  const englishNumbers = splitString
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const numericString = englishNumbers.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : null;
};

// سه حالت منعطف استراتژی کش: کاملاً زنده، کاملاً کش، یا ISR زمان‌دار
type CacheStrategy =
  | { type: 'no-store' }
  | { type: 'force-cache' }
  | { type: 'revalidate'; seconds: number };

export async function fetchGraphQL(
  query: string,
  variables: Record<string, unknown> = {},
  tags: string[] = [],
  cacheStrategy: CacheStrategy | RequestCache = 'force-cache'
) {
  // حفظ Backward Compatibility برای استرینگ‌های قدیمی پاس داده شده به متد
  const strategy: CacheStrategy =
    typeof cacheStrategy === 'string'
      ? cacheStrategy === 'no-store'
        ? { type: 'no-store' }
        : { type: 'force-cache' }
      : cacheStrategy;

  // کانفیگ آپشن‌های فچ هماهنگ با تایپ‌های گلوبال Next.js 16
  const fetchOptions: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  };

  if (strategy.type === 'no-store') {
    fetchOptions.cache = 'no-store';
  } else if (strategy.type === 'revalidate') {
    // ✅ سیستم جدید کش ترکیبی زمان‌دار با تگ اختصاصی
    fetchOptions.next = {
      revalidate: strategy.seconds,
      tags: tags.length > 0 ? tags.map(t => encodeURIComponent(t)) : undefined,
    };
  } else {
    fetchOptions.cache = 'force-cache';
    if (tags.length > 0) {
      fetchOptions.next = { tags: tags.map(t => encodeURIComponent(t)) };
    }
  }

  try {
    const res = await fetch(WP_GRAPHQL_URL, fetchOptions);

    if (!res.ok) {
      console.error(`GraphQL HTTP Error: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    if (json.errors) {
      console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
      return null;
    }

    return json.data;
  } catch (error) {
    console.error('Fetch GraphQL Network Error:', error);
    return null;
  }
}