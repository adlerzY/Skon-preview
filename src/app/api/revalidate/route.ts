import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-revalidate-secret");

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    if (!checkRateLimit(`revalidate:${ip}`, { max: 20, windowMs: 60 * 1000 })) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
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

    return NextResponse.json({
      revalidated: true,
      tag,
      now: Date.now(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}