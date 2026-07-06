import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");
const ALLOWED_EXT = [".webp", ".png", ".jpg", ".jpeg"];

export async function GET() {
  try {
    const files = await fs.readdir(AVATARS_DIR);
    const avatars = files.filter((f) => ALLOWED_EXT.includes(path.extname(f).toLowerCase())).sort().map((f) => `/avatars/${f}`);
    return NextResponse.json({ avatars });
  } catch {
    return NextResponse.json({ avatars: [] });
  }
}