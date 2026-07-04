import "server-only";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const FALLBACK_LOCAL_URL = "http://tazavesh.local/graphql";
const REQUEST_TIMEOUT_MS = 10_000;

if (!WP_GRAPHQL_URL && process.env.NODE_ENV === "production") {
  console.error(
    "[graphql/client] NEXT_PUBLIC_WORDPRESS_API_URL تنظیم نشده؛ درخواست‌های GraphQL fail خواهند شد."
  );
}

export const parsePrice = (priceString?: string | null): number | null => {
  if (!priceString) return null;
  const splitString = String(priceString).split(/[-–—]|&ndash;/)[0];
  const englishNumbers = splitString
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  const numericString = englishNumbers.replace(/[^0-9]/g, "");
  return numericString ? parseInt(numericString, 10) : null;
};

type CacheStrategy =
  | { type: "no-store" }
  | { type: "force-cache" }
  | { type: "revalidate"; seconds: number };

export async function fetchGraphQL(
  query: string,
  variables: Record<string, unknown> = {},
  tags: string[] = [],
  cacheStrategy: CacheStrategy | RequestCache = "force-cache",
  authToken?: string
) {
  const strategy: CacheStrategy =
    typeof cacheStrategy === "string"
      ? cacheStrategy === "no-store"
        ? { type: "no-store" }
        : { type: "force-cache" }
      : cacheStrategy;

  const fetchOptions: RequestInit & {
    next?: { tags?: string[]; revalidate?: number };
  } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  };

  if (strategy.type === "no-store") {
    fetchOptions.cache = "no-store";
  } else if (strategy.type === "revalidate") {
    fetchOptions.next = {
      revalidate: strategy.seconds,
      tags: tags.length > 0 ? tags.map((t) => encodeURIComponent(t)) : undefined,
    };
  } else {
    fetchOptions.cache = "force-cache";
    if (tags.length > 0) {
      fetchOptions.next = { tags: tags.map((t) => encodeURIComponent(t)) };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  fetchOptions.signal = controller.signal;

  try {
    const res = await fetch(WP_GRAPHQL_URL || FALLBACK_LOCAL_URL, fetchOptions);

    if (!res.ok) {
      console.error(`GraphQL HTTP Error: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    if (json.errors) {
      console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
      return null;
    }

    return json.data;
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      console.error(`GraphQL request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      console.error("Fetch GraphQL Network Error:", error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}