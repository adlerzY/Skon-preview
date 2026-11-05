import { cookies } from "next/headers";
import { SESSION_ID_COOKIE } from "@/lib/auth/constants";
import "server-only";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const INTERNAL_WP_GRAPHQL_URL = process.env.INTERNAL_WORDPRESS_API_URL;
const FALLBACK_LOCAL_URL = "http://tazavesh.local/graphql";
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
const REQUEST_TIMEOUT_MS = Number(process.env.GRAPHQL_REQUEST_TIMEOUT_MS) || (IS_BUILD ? 8_000 : 10_000);
const MAX_CONCURRENT = Number(process.env.GRAPHQL_MAX_CONCURRENCY) || (IS_BUILD ? 3 : 8);
const QUEUE_WAIT_MS = 10_000;
const BREAKER_THRESHOLD = 5;
const BREAKER_COOLDOWN_MS = 15_000;

if (!WP_GRAPHQL_URL && process.env.NODE_ENV === "production") {
  console.error(
    "[graphql/client] NEXT_PUBLIC_WORDPRESS_API_URL تنظیم نشده؛ درخواست‌های GraphQL fail خواهند شد."
  );
}

interface Waiter {
  resolve: (acquired: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface GraphQLRuntime {
  active: number;
  queue: Waiter[];
  inflight: Map<string, Promise<any>>;
  failures: number;
  openUntil: number;
}

const RUNTIME_KEY = Symbol.for("arena2battle.graphql.runtime");
const globalRuntime = globalThis as typeof globalThis & { [RUNTIME_KEY]?: GraphQLRuntime };
const runtime: GraphQLRuntime =
  globalRuntime[RUNTIME_KEY] ??
  (globalRuntime[RUNTIME_KEY] = {
    active: 0,
    queue: [],
    inflight: new Map(),
    failures: 0,
    openUntil: 0,
  });

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

interface ExecuteArgs {
  query: string;
  variables: Record<string, unknown>;
  tags: string[];
  strategy: CacheStrategy;
  authToken?: string;
  sessionId?: string;
  bootstrapProof?: string;
  previousAuthToken?: string;
  extraHeaders: Record<string, string>;
}

interface ExecuteResult {
  data: any;
  failed: boolean;
}

function normalizeStrategy(value: CacheStrategy | RequestCache): CacheStrategy {
  if (typeof value !== "string") return value;
  return value === "no-store" ? { type: "no-store" } : { type: "force-cache" };
}

function breakerIsOpen(): boolean {
  return Date.now() < runtime.openUntil;
}

function recordSuccess() {
  runtime.failures = 0;
}

function recordFailure() {
  runtime.failures += 1;
  if (runtime.failures >= BREAKER_THRESHOLD) {
    const wasOpen = breakerIsOpen();
    runtime.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    runtime.failures = BREAKER_THRESHOLD - 1;
    if (!wasOpen) {
      console.error(`[graphql] backend unreachable, pausing public requests for ${BREAKER_COOLDOWN_MS}ms`);
    }
  }
}

function acquireSlot(): Promise<boolean> {
  if (runtime.active < MAX_CONCURRENT) {
    runtime.active += 1;
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    const waiter: Waiter = {
      resolve,
      timer: setTimeout(() => {
        const index = runtime.queue.indexOf(waiter);
        if (index !== -1) runtime.queue.splice(index, 1);
        resolve(false);
      }, QUEUE_WAIT_MS),
    };
    runtime.queue.push(waiter);
  });
}

function releaseSlot() {
  const waiter = runtime.queue.shift();
  if (waiter) {
    clearTimeout(waiter.timer);
    waiter.resolve(true);
    return;
  }
  runtime.active = Math.max(0, runtime.active - 1);
}

async function execute(args: ExecuteArgs): Promise<ExecuteResult> {
  const { query, variables, tags, strategy, authToken, sessionId, bootstrapProof, previousAuthToken, extraHeaders } = args;
  const { url: endpointUrl, hostHeader } = resolveEndpoint();

  let boundSessionId = sessionId;

  const needsSessionBinding = Boolean(authToken || bootstrapProof || previousAuthToken || sessionId);

  if (needsSessionBinding && !boundSessionId) {
    try {
      const cookieStore = await cookies();
      boundSessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
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
      fetchOptions.next = {
        tags: tags.map((t) => encodeURIComponent(t)),
      };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(endpointUrl, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`GraphQL HTTP Error: ${res.status} ${res.statusText}`);
      return { data: null, failed: res.status >= 500 };
    }

    const json = await res.json();

    if (json.errors) {
      console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));

      if (!json.data) {
        console.error("GraphQL query preview:", query.trim().slice(0, 160));
        return { data: null, failed: false };
      }
    }

    return { data: json.data ?? null, failed: false };
  } catch (error) {
    const isAbort = (error as Error)?.name === "AbortError";

    if (isAbort) {
      console.error(
        `GraphQL request timed out after ${REQUEST_TIMEOUT_MS}ms — query preview:`,
        query.trim().slice(0, 160)
      );
    } else {
      console.error("Fetch GraphQL Network Error:", error);
    }

    return { data: null, failed: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runPublic(args: ExecuteArgs): Promise<any> {
  const acquired = await acquireSlot();

  if (!acquired) {
    console.error("GraphQL queue wait exceeded — query preview:", args.query.trim().slice(0, 160));
    return null;
  }

  try {
    if (breakerIsOpen()) return null;

    const result = await execute(args);

    if (result.failed) recordFailure();
    else recordSuccess();

    return result.data;
  } finally {
    releaseSlot();
  }
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
): Promise<any> {
  const strategy = normalizeStrategy(cacheStrategy);

  const args: ExecuteArgs = {
    query,
    variables,
    tags,
    strategy,
    authToken,
    sessionId,
    bootstrapProof,
    previousAuthToken,
    extraHeaders,
  };

  const isPublic =
    !authToken &&
    !sessionId &&
    !bootstrapProof &&
    !previousAuthToken &&
    Object.keys(extraHeaders).length === 0;

  if (!isPublic) {
    const result = await execute(args);
    return result.data;
  }

  if (breakerIsOpen()) return null;

  const key = [
    strategy.type,
    strategy.type === "revalidate" ? strategy.seconds : "",
    tags.join(","),
    query,
    JSON.stringify(variables),
  ].join("\u0001");

  const pending = runtime.inflight.get(key);
  if (pending) return pending;

  const request = runPublic(args).finally(() => {
    runtime.inflight.delete(key);
  });

  runtime.inflight.set(key, request);
  return request;
}