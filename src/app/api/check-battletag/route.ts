import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// ✅ نکته: در production این لیست باید از دیتابیس یا env بیاد
// فایل battletags.json نباید در repository عمومی commit بشه
// پیشنهاد: جابجا کردن به خارج از src/ و اضافه کردن به .gitignore

async function getBattleTagsList(): Promise<string[]> {
  try {
    // اگه environment variable تعریف شده، از اون استفاده کن
    if (process.env.BATTLETAGS_LIST) {
      return JSON.parse(process.env.BATTLETAGS_LIST);
    }
    // fallback به فایل (فقط برای local development)
    const jsonDir = path.join(process.cwd(), "src/data");
    const contents = await fs.readFile(path.join(jsonDir, "battletags.json"), "utf8");
    return JSON.parse(contents);
  } catch {
    return [];
  }
}

// ✅ validate فرمت BattleTag
function isValidBattleTagFormat(tag: string): boolean {
  // فرمت: Name#Numbers — حداکثر ۱۲ کاراکتر قبل از # و ۴-۷ رقم بعد از آن
  return /^[A-Za-z\u0600-\u06FF0-9]{2,12}#\d{4,7}$/.test(tag);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { battleTag } = body;

    if (!battleTag || typeof battleTag !== "string") {
      return NextResponse.json(
        { valid: false, message: "بتل‌تگ ارسال نشده" },
        { status: 400 }
      );
    }

    // ✅ بررسی فرمت قبل از جستجو
    if (!isValidBattleTagFormat(battleTag.trim())) {
      return NextResponse.json(
        { valid: false, message: "فرمت بتل‌تگ نامعتبر است. مثال صحیح: PlayerName#1234" },
        { status: 400 }
      );
    }

    const friendsList = await getBattleTagsList();

    const exists = friendsList.some(
      tag => tag.toLowerCase() === battleTag.trim().toLowerCase()
    );

    if (exists) {
      return NextResponse.json({ valid: true, message: "بتل‌تگ تایید شد" }, { status: 200 });
    } else {
      return NextResponse.json(
        { valid: false, message: "شما در لیست فرندهای ما نیستید" },
        { status: 404 }
      );
    }
  } catch {
    return NextResponse.json(
      { valid: false, message: "خطای سرور در بررسی بتل‌تگ" },
      { status: 500 }
    );
  }
}
