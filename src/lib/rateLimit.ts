import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitEntry { count: number; resetAt: number; }

const memoryStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupMemory(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}

function checkMemoryRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  cleanupMemory(now);
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

const isProduction = process.env.NODE_ENV === "production";
const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
const allowMemoryFallback =
  process.env.RATE_LIMIT_ALLOW_MEMORY_FALLBACK === "true" || !isProduction;
const trustProxyHeaders = isProduction
  ? process.env.RATE_LIMIT_TRUST_PROXY_HEADERS === "true"
  : process.env.RATE_LIMIT_TRUST_PROXY_HEADERS !== "false";
const DISTRIBUTED_REQUIRED_PREFIXES = [
  "auth-",
  "admin-",
  "phone-",
  "password-",
  "login-",
  "checkout",
  "revalidate",
  "review-",
  "review:",
  "reviews-list:",
  "blog-posts:",
  "blog-comments-list:",
  "blog-comment-write",
  "blog-comment-reply",
  "blog-follow",
  "blog-rate",
  "ticket-",
  "set-password-",
  "profile:",
  "reveal:",
  "revoke-session",
  "avatar-",
];
let warnedMissingUpstash = false;

function requiresDistributedLimit(key: string): boolean {
  return DISTRIBUTED_REQUIRED_PREFIXES.some((prefix) => key.startsWith(prefix));
}


const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(max: number, windowMs: number): Ratelimit {
  const cacheKey = `${max}:${windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(max, `${Math.max(1, Math.round(windowMs / 1000))} s`),
    analytics: false,
    prefix: "btl_ratelimit",
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export function getClientIp(request: Request): string {
  if (trustProxyHeaders) {
    const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
    if (cloudflareIp) return cloudflareIp;
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  const directIp = request.headers.get("x-real-ip")?.trim();
  if (directIp && process.env.RATE_LIMIT_TRUST_REAL_IP === "true") return directIp;

  return "unknown";
}

export function getRateLimitHealth(): {
  distributedConfigured: boolean;
  production: boolean;
  memoryFallbackAllowed: boolean;
  trustProxyHeaders: boolean;
  proxyTrustConfigured: boolean;
} {
  return {
    distributedConfigured: hasUpstash,
    production: isProduction,
    memoryFallbackAllowed: allowMemoryFallback,
    trustProxyHeaders,
    proxyTrustConfigured: !isProduction || trustProxyHeaders || process.env.RATE_LIMIT_TRUST_REAL_IP === "true",
  };
}

export async function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): Promise<boolean> {
  const distributedRequired = requiresDistributedLimit(key);

  if (!redis) {
    if (isProduction && distributedRequired && !allowMemoryFallback) {
      if (!warnedMissingUpstash) {
        warnedMissingUpstash = true;
        console.error(
          "[rateLimit] Upstash is required in production for security-sensitive rate limits. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or explicitly set RATE_LIMIT_ALLOW_MEMORY_FALLBACK=true."
        );
      }
      return false;
    }

    return checkMemoryRateLimit(key, max, windowMs);
  }

  try {
    const { success } = await getLimiter(max, windowMs).limit(key);
    return success;
  } catch (error) {
    if (isProduction && distributedRequired && !allowMemoryFallback) {
      console.error("Upstash rate limit error; failing closed for security-sensitive action:", error);
      return false;
    }

    console.error("Upstash rate limit error, falling back to memory:", error);
    return checkMemoryRateLimit(key, max, windowMs);
  }
}