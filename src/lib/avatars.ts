import "server-only";
import { promises as fs } from "fs";
import path from "path";

const AVATARS_ROOT = path.join(process.cwd(), "public", "avatars");
const USERS_DIR = path.join(AVATARS_ROOT, "users");
const ADMIN_DIR = path.join(AVATARS_ROOT, "admin");
const ALLOWED_EXT = [".webp", ".png", ".jpg", ".jpeg"];
const CACHE_TTL_MS = 5 * 60 * 1000;

interface AvatarCache {
  users: string[];
  admin: string[];
  cachedAt: number;
}

let cache: AvatarCache | null = null;

async function readDir(dir: string, urlPrefix: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => ALLOWED_EXT.includes(path.extname(f).toLowerCase()))
      .sort()
      .map((f) => `${urlPrefix}/${f}`);
  } catch {
    return [];
  }
}

async function loadAvatars(): Promise<AvatarCache> {
  const now = Date.now();
  if (cache && now - cache.cachedAt < CACHE_TTL_MS) {
    return cache;
  }

  const [users, admin] = await Promise.all([
    readDir(USERS_DIR, "/avatars/users"),
    readDir(ADMIN_DIR, "/avatars/admin"),
  ]);

  cache = { users, admin, cachedAt: now };
  return cache;
}

export async function listAvatars(scope: "users" | "admin" | "all" = "users"): Promise<string[]> {
  const { users, admin } = await loadAvatars();
  if (scope === "admin") return admin;
  if (scope === "all") return [...users, ...admin];
  return users;
}

export async function getDefaultAvatarUrl(): Promise<string | null> {
  const { users } = await loadAvatars();
  const explicit = users.find((u) => /\/default\.(webp|png|jpe?g)$/i.test(u));
  return explicit ?? users[0] ?? null;
}

export async function isValidAvatarPath(avatarUrl: string, allowAdmin: boolean): Promise<boolean> {
  const { users, admin } = await loadAvatars();
  const pool = allowAdmin ? [...users, ...admin] : users;
  return pool.includes(avatarUrl);
}

export async function resolveAvatarUrl(avatarUrl?: string | null): Promise<string | null> {
  if (avatarUrl) return avatarUrl;
  return getDefaultAvatarUrl();
}