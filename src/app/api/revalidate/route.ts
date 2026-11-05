import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_TAGS_PER_REQUEST = 1000;
const MAX_TAG_LENGTH = 256;
const HOME_PATH_TAGS = new Set([
  "banners",
  "home",
  "products",
  "products-pricing",
  "home-featured",
  "home-latest",
  "home-featured-pricing",
  "home-latest-pricing",
]);

function timingSafeSecretEquals(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;

  const actualHash = crypto.createHash("sha256").update(actual).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();

  return crypto.timingSafeEqual(actualHash, expectedHash);
}

function tagVariants(tag: string): string[] {
  if (!tag.includes("%") && /^[\x21-\x7E]+$/.test(tag)) return [tag];

  let decoded = tag;
  try {
    decoded = decodeURIComponent(tag);
  } catch {
    decoded = tag;
  }

  const encoded = encodeURIComponent(decoded);
  const lowerEncoded = encoded.replace(/%[0-9A-F]{2}/g, (match) => match.toLowerCase());
  const base = [tag, decoded, encoded, lowerEncoded];

  return Array.from(new Set(base.flatMap((value) => [value, encodeURIComponent(value)]))).filter(
    (value) => value.length > 0 && value.length <= MAX_TAG_LENGTH
  );
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-revalidate-secret");
    const expected = process.env.REVALIDATION_SECRET;

    if (!expected || !secret || !timingSafeSecretEquals(secret, expected)) {
      const ip = getClientIp(request);
      const allowed = await checkRateLimit(`bad-secret:${ip}`, { max: 20, windowMs: 60 * 1000 });
      return NextResponse.json({ message: "Unauthorized" }, { status: allowed ? 401 : 429 });
    }

    const body = await request.json();
    const tag = body?.tag;

    if (!tag) {
      return NextResponse.json({ message: "Missing tag" }, { status: 400 });
    }

    const requestedTags = Array.isArray(tag) ? tag : [tag];

    if (requestedTags.length > MAX_TAGS_PER_REQUEST) {
      return NextResponse.json({ message: "Too many tags" }, { status: 413 });
    }

    const tags: string[] = requestedTags.filter(
      (t: unknown): t is string => typeof t === "string" && t.trim() !== ""
    );

    if (tags.length !== requestedTags.length || tags.length === 0) {
      return NextResponse.json({ message: "Invalid tag list" }, { status: 400 });
    }

    const revalidated: string[] = [];
    const failed: string[] = [];
    let pathRevalidated = false;

    for (const t of tags) {
      if (t === "all") {
        try {
          revalidatePath("/", "layout");
          pathRevalidated = true;
        } catch (err) {
          console.error('Failed to revalidate path for tag "all":', err);
          failed.push(t);
        }
        continue;
      }

      try {
        for (const variant of tagVariants(t)) {
          revalidateTag(variant, { expire: 0 });
        }

        if (!pathRevalidated && HOME_PATH_TAGS.has(t)) {
          revalidatePath("/[region]", "page");
          pathRevalidated = true;
        }

        revalidated.push(t);
      } catch (err) {
        console.error(`Failed to revalidate tag "${t}":`, err);
        failed.push(t);
      }
    }

    if (failed.length > 0) {
      return NextResponse.json(
        { revalidated, failed, pathRevalidated, now: Date.now() },
        { status: 500 }
      );
    }

    return NextResponse.json({
      revalidated: revalidated.length,
      pathRevalidated,
      now: Date.now(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}