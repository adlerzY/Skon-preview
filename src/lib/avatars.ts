import "server-only";
import { promises as fs } from "fs";
import path from "path";

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");
const ALLOWED_EXT = [".webp", ".png", ".jpg", ".jpeg"];

export async function listAvatars(): Promise<string[]> {
  try {
    const files = await fs.readdir(AVATARS_DIR);
    return files
      .filter((f) => ALLOWED_EXT.includes(path.extname(f).toLowerCase()))
      .sort()
      .map((f) => `/avatars/${f}`);
  } catch {
    return [];
  }
}

export async function getDefaultAvatarUrl(): Promise<string | null> {
  const avatars = await listAvatars();
  return avatars[0] ?? null;
}

export async function resolveAvatarUrl(avatarUrl?: string | null): Promise<string | null> {
  if (avatarUrl) return avatarUrl;
  return getDefaultAvatarUrl();
}