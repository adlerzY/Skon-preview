import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { timingSafeEqual } from "crypto";

const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;
const MAX_TRACKED_IPS = 5000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function pruneIfNeeded(now: number) {
  if (rateLimitMap.size <= MAX_TRACKED_IPS) return;
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) rateLimitMap.delete(key);
  }
  if (rateLimitMap.size > MAX_TRACKED_IPS) {
    const excess = rateLimitMap.size - MAX_TRACKED_IPS;
    const keys = rateLimitMap.keys();
    for (let i = 0; i < excess; i++) {
      const k = keys.next().value;
      if (k) rateLimitMap.delete(k);
    }
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  pruneIfNeeded(now);
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-revalidate-secret");
    const expected = process.env.REVALIDATION_SECRET;

    if (!expected || !secret || !safeCompare(secret, expected)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
    }

    const body = await request.json();
    const tag = body.tag;

    if (!tag) {
      return NextResponse.json({ message: "Missing tag" }, { status: 400 });
    }

    const tagsArray: string[] = Array.isArray(tag) ? tag : [tag];

    for (const t of tagsArray) {
      try {
        revalidateTag(t, "default");
      } catch (err) {
        console.error(`Failed to revalidate tag "${t}":`, err);
      }

      try {
        revalidateTag(encodeURIComponent(t), "default");
      } catch (err) {
        console.error(`Failed to revalidate encoded tag "${t}":`, err);
      }

      if (t === "products" || t === "all") {
        try {
          revalidatePath("/", "layout");
        } catch (err) {
          console.error(`Failed to revalidate path for tag "${t}":`, err);
        }
      }
    }

    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}