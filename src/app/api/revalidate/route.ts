import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_TAGS_PER_REQUEST = 1000;

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-revalidate-secret");
    const expected = process.env.REVALIDATION_SECRET;

    if (!expected || secret !== expected) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);

    if (
      !(await checkRateLimit(`revalidate:${ip}`, {
        max: 120,
        windowMs: 60 * 1000,
      }))
    ) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json();
    const tag = body?.tag;

    if (!tag) {
      return NextResponse.json({ message: "Missing tag" }, { status: 400 });
    }

    const requestedTags = Array.isArray(tag) ? tag : [tag];

    if (requestedTags.length > MAX_TAGS_PER_REQUEST) {
      return NextResponse.json(
        { message: "Too many tags" },
        { status: 413 }
      );
    }

    const tags: string[] = requestedTags.filter(
      (t: unknown): t is string =>
        typeof t === "string" && t.trim() !== ""
    );

    if (tags.length !== requestedTags.length || tags.length === 0) {
      return NextResponse.json(
        { message: "Invalid tag list" },
        { status: 400 }
      );
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
        // Pricing-bearing catalog tags must expire immediately. They are also
        // used by Home/Archive caches that contain the rendered price, so a
        // 30-minute stale window would reintroduce exactly the mismatch this
        // invalidation path is meant to prevent.
        const immediate =
          t.startsWith("product-pricing-") ||
          t === "home-featured" ||
          t === "home-latest" ||
          t === "products" ||
          t.startsWith("category-");
        const expire = immediate ? 0 : 1800;

        revalidateTag(t, { expire });

        const encoded = encodeURIComponent(t);

        if (encoded !== t) {
          revalidateTag(encoded, { expire });
        }

        if (
          (t === "home-featured" || t === "home-latest") &&
          !pathRevalidated
        ) {
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
        {
          revalidated,
          failed,
          pathRevalidated,
          now: Date.now(),
        },
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

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}