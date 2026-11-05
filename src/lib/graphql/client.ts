import { cookies } from "next/headers";
import { SESSION_ID_COOKIE } from "@/lib/auth/constants";
import "server-only";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const INTERNAL_WP_GRAPHQL_URL = process.env.INTERNAL_WORDPRESS_API_URL;
const FALLBACK_LOCAL_URL = "http://tazavesh.local/graphql";
const REQUEST_TIMEOUT_MS = Number(process.env.GRAPHQL_REQUEST_TIMEOUT_MS) || 12_000;
const MAX_ATTEMPTS = Math.min(2, Math.max(1, Number(process.env.GRAPHQL_MAX_ATTEMPTS) || 2));
const RETRY_DELAY_MS = Math.max(100, Number(process.env.GRAPHQL_RETRY_DELAY_MS) || 350);

const MIN_TOTAL_TIMEOUT_MS =
  REQUEST_TIMEOUT_MS * MAX_ATTEMPTS +
  RETRY_DELAY_MS * Math.max(0, MAX_ATTEMPTS - 1);

const GRAPHQL_TOTAL_TIMEOUT_MS = Math.max(
  MIN_TOTAL_TIMEOUT_MS,
  Number(process.env.GRAPHQL_TOTAL_TIMEOUT_MS) || 0
);

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
  if (priceString === null || priceString === undefined) return null;
  const raw = String(priceString).trim();
  if (raw === "" || raw.toLowerCase() === "disabled") return null;
  const lowerBound = raw.split(/\s*(?:-|–|—|&ndash;)\s*/u)[0];
  const englishNumbers = lowerBound
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  const numericString = englishNumbers.replace(/[,،\s]/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(numericString)) return null;
  const value = Number(numericString);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

type CacheStrategy =
  | { type: "no-store" }
  | { type: "force-cache" }
  | { type: "revalidate"; seconds: number };

class GraphQLRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphQLRequestError";
  }
}

function isRetrySafeQuery(query: string): boolean {
  const source = query.replace(/^\uFEFF/u, "").trim();

  return !/\bmutation\b|\bsubscription\b/i.test(source);
}

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
  if (needsSessionBinding) {
    try {
      const cookieStore = await cookies();
      if (!boundSessionId) boundSessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
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

  const maxAttempts = isRetrySafeQuery(query) ? MAX_ATTEMPTS : 1;
  const deadline = Date.now() + GRAPHQL_TOTAL_TIMEOUT_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;

    const attemptTimeoutMs = Math.min(REQUEST_TIMEOUT_MS, remainingMs);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), attemptTimeoutMs);

    try {
      const res = await fetch(endpointUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status >= 500 && attempt < maxAttempts && Date.now() + RETRY_DELAY_MS < deadline) {
          await delay(RETRY_DELAY_MS);
          continue;
        }
        throw new GraphQLRequestError(`GraphQL HTTP Error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();

      if (Array.isArray(json?.errors) && json.errors.length > 0) {
        console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
        console.error("GraphQL query preview:", query.trim().slice(0, 160));

        const retryableGraphQLError = json.errors.some((item: { message?: string; extensions?: { code?: string } }) => {
          const code = String(item?.extensions?.code ?? "").toUpperCase();
          const message = String(item?.message ?? "");
          return ["INTERNAL_SERVER_ERROR", "SERVICE_UNAVAILABLE", "TIMEOUT", "DB_CONNECTION_ERROR"].includes(code)
            || /temporar|timed?\s*out|timeout|database|connection|internal server error|server unavailable/i.test(message);
        });

        if (retryableGraphQLError && attempt < maxAttempts && Date.now() + RETRY_DELAY_MS < deadline) {
          await delay(RETRY_DELAY_MS);
          continue;
        }

        throw new GraphQLRequestError("GraphQL response contained errors");
      }

      if (!json || typeof json.data !== "object" || json.data === null) {
        throw new GraphQLRequestError("GraphQL response did not contain usable data");
      }

      return json.data;
    } catch (error) {
      if (error instanceof GraphQLRequestError) throw error;

      const isAbort = (error as Error)?.name === "AbortError";
      if (isAbort) {
        console.error(`GraphQL request timed out after ${attemptTimeoutMs}ms — query preview:`, query.trim().slice(0, 160));
      } else {
        console.error("Fetch GraphQL Network Error:", error);
      }

      if (attempt < maxAttempts && Date.now() + RETRY_DELAY_MS < deadline) {
        await delay(RETRY_DELAY_MS);
        continue;
      }

      throw new GraphQLRequestError(
        isAbort
          ? `GraphQL request timed out after ${GRAPHQL_TOTAL_TIMEOUT_MS}ms`
          : "GraphQL network request failed"
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new GraphQLRequestError(`GraphQL request exceeded ${GRAPHQL_TOTAL_TIMEOUT_MS}ms`);
}
