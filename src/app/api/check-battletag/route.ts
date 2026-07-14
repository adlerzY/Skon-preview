import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

function isValidBattleTagFormat(tag: string): boolean {
  return /^[A-Za-z\u0600-\u06FF0-9]{2,12}#\d{4,7}$/.test(tag);
}

async function getBattleTagsList(): Promise<string[]> {
  if (process.env.BATTLETAGS_LIST) {
    try {
      return JSON.parse(process.env.BATTLETAGS_LIST);
    } catch {
      console.error("BATTLETAGS_LIST env var is not valid JSON");
      return [];
    }
  }

  if (process.env.NODE_ENV !== "development") {
    console.error("BATTLETAGS_LIST env var is not set in production");
    return [];
  }

  try {
    const filePath = path.join(process.cwd(), "data", "battletags.json");
    const contents = await fs.readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`battletag:${ip}`, { max: 10, windowMs: 60 * 1000 })) {
    return NextResponse.json(
      { valid: false, message: "تعداد درخواست‌ها بیش از حد مجاز است" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await request.json();
    const { battleTag } = body;

    if (!battleTag || typeof battleTag !== "string") {
      return NextResponse.json(
        { valid: false, message: "بتل‌تگ ارسال نشده" },
        { status: 400 }
      );
    }

    const trimmedTag = battleTag.trim();

    if (!isValidBattleTagFormat(trimmedTag)) {
      return NextResponse.json(
        {
          valid: false,
          message: "فرمت بتل‌تگ نامعتبر است. مثال صحیح: PlayerName#1234",
        },
        { status: 400 }
      );
    }

    const friendsList = await getBattleTagsList();
    const exists = friendsList.includes(trimmedTag);

    if (exists) {
      return NextResponse.json(
        { 
          valid: true, 
          isFriend: true, 
          message: "شما در فرند لیست ما هستید، ثبت سفارش شما در کمتر از یک ساعت انجام می‌شود." 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          valid: true, 
          isFriend: false, 
          message: "سفارش شما با این بتل‌تگ جدید در سبد خرید ثبت شد." 
        },
        { status: 200 }
      );
    }
  } catch {
    return NextResponse.json(
      { valid: false, message: "خطای سرور در بررسی بتل‌تگ" },
      { status: 500 }
    );
  }
}