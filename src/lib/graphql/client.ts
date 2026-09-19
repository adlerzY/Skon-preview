import { cookies } from "next/headers";
import { SESSION_ID_COOKIE } from "@/lib/auth/constants";
import "server-only";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const INTERNAL_WP_GRAPHQL_URL = process.env.INTERNAL_WORDPRESS_API_URL;
const FALLBACK_LOCAL_URL = "http://tazavesh.local/graphql";
const REQUEST_TIMEOUT_MS = Number(process.env.GRAPHQL_REQUEST_TIMEOUT_MS) || 12_000;
const MAX_ATTEMPTS = Math.max(1, Number(process.env.GRAPHQL_MAX_ATTEMPTS) || 1);
const RETRY_DELAY_MS = Math.max(100, Number(process.env.GRAPHQL_RETRY_DELAY_MS) || 350);

if (!WP_GRAPHQL_URL && process.env.NODE_ENV === "production") {
  console.error(
    "[graphql/client] NEXT_PUBLIC_WORDPRESS_API_URL تنظیم نشده؛ درخواست‌های GraphQL fail خواهند شد."
  );
}

function resolveEndpoint(): { url: string; hostHeader?: string } {
  const publicUrl = WP_GRAPHQL_URL || (process.env.NODE_ENV === "production" ? "" : FALLBACK_LOCAL_URL);
  if (!publicUrl) throw new Error("NEXT_PUBLIC_WORDPRESS_API_URL is not configured in production");

  if (!INTERNAL_WP_GRAPHQL_URL) {
    return { url: publicUrl };
  }

  let hostHeader: string | undefined;
  try {
    hostHeader = new URL(publicUrl).host;
  } catch {
    hostHeader = undefined;
  }

  return { url: INTERNAL_WP_GRAPHQL_URL, hostHeader };
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchGraphQL(
  query: string,
  variables: Record<string, unknown> = {},
  tags: string[] = [],
  cacheStrategy: CacheStrategy | RequestCache = "force-cache",
  authToken?: string,
  sessionId?: string,
  bootstrapProof?: string,
  previousAuthToken?: string,
  extraHeaders: Record<string, string> = {}
) {
  const strategy: CacheStrategy =
    typeof cacheStrategy === "string"
      ? cacheStrategy === "no-store"
        ? { type: "no-store" }
        : { type: "force-cache" }
      : cacheStrategy;

  const { url: endpointUrl, hostHeader } = resolveEndpoint();
  let boundSessionId = sessionId;
  const needsSessionBinding = Boolean(authToken || bootstrapProof || previousAuthToken || sessionId);
  if (needsSessionBinding && !boundSessionId) {
    try {
      boundSessionId = (await cookies()).get(SESSION_ID_COOKIE)?.value;
    } catch {}
  }

  const fetchOptions: RequestInit & {
    next?: { tags?: string[]; revalidate?: number };
  } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(boundSessionId ? { "X-BTL-Session-ID": boundSessionId } : {}),
      ...(bootstrapProof ? { "X-BTL-Session-Bootstrap": bootstrapProof } : {}),
      ...(previousAuthToken ? { "X-BTL-Previous-Authorization": `Bearer ${previousAuthToken}` } : {}),
      ...(hostHeader ? { Host: hostHeader } : {}),
      ...extraHeaders,
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

  const isMutation = /^mutation\b/i.test(query.trim());
  const maxAttempts = isMutation ? 1 : MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(endpointUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status >= 502 && attempt < maxAttempts) {
          await delay(RETRY_DELAY_MS);
          continue;
        }
        console.error(`GraphQL HTTP Error: ${res.status} ${res.statusText}`);
        return null;
      }

      const json = await res.json();

      if (json.errors) {
        console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
        if (!json.data) {
          console.error("GraphQL query preview:", query.trim().slice(0, 160));
          return null;
        }
      }

      return json.data;
    } catch (error) {
      const isAbort = (error as Error)?.name === "AbortError";
      if (isAbort) {
        console.error(`GraphQL request timed out after ${REQUEST_TIMEOUT_MS}ms — query preview:`, query.trim().slice(0, 160));
      } else {
        console.error("Fetch GraphQL Network Error:", error);
      }
      if (attempt < maxAttempts) {
        await delay(RETRY_DELAY_MS);
        continue;
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}