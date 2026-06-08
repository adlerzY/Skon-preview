//هسته اتصال به وردپرس و پردازشگرهای اولیه قیمت
const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://tazavesh.local/graphql';

export const parsePrice = (priceString?: string | null): number | null => {
  if (!priceString) return null;
  const splitString = String(priceString).split(/[-–—]|&ndash;/)[0];
  const englishNumbers = splitString
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const numericString = englishNumbers.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : null;
};

export async function fetchGraphQL(query: string, variables: any = {}, tags: string[] = [], cacheMode: RequestCache = 'default') { 
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: cacheMode === 'no-store' ? 'no-store' : 'force-cache'
  };

  if (cacheMode !== 'no-store' && tags.length > 0) {
    const safeTags = tags.map(tag => encodeURIComponent(tag));
    fetchOptions.next = { tags: safeTags };
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