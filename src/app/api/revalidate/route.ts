import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

// ✅ سیستم Rate Limit ساده درون‌حافظه‌ای برای جلوگیری از DDoS روت
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;        // حداکثر ۲۰ درخواست
const WINDOW_MS = 60 * 1000; // در بازه زمانی ۶۰ ثانیه‌ای

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-revalidate-secret");

    // بررسی توکن امنیتی
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // بررسی محدودیت تعداد درخواست (Rate Limit) بر اساس IP فرستنده
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
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

    tagsArray.forEach(t => {
      try { 
        // ✅ اضافه شدن آرگومان دوم 'default' برای سازگاری کامل با معماری کش نکس ۱۶
        revalidateTag(t, 'default'); 
      } catch { /* ignore */ }
      
      try { 
        // بررسی حالت انکود شده تگ‌ها جهت اطمینان از حذف کش اسلاگ‌های خاص
        revalidateTag(encodeURIComponent(t), 'default'); 
      } catch { /* ignore */ }

      // در صورت آپدیت کلی محصولات یا کل سایت، کل لایوت اصلی ری‌ولیدیت می‌شود
      if (t === "products" || t === "all") {
        revalidatePath("/", "layout");
      }
    });

    return NextResponse.json({
      revalidated: true,
      tag,
      now: Date.now(),
    });

  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}