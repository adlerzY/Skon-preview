import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { unstable_cache } from "next/cache";

const AVATARS_ROOT = path.join(process.cwd(), "public", "avatars");
const USERS_DIR = path.join(AVATARS_ROOT, "users");
const ADMIN_DIR = path.join(AVATARS_ROOT, "admin");
const ALLOWED_EXT = [".webp", ".png", ".jpg", ".jpeg"];

const SAFE_AVATAR_ID = /^[A-Za-z0-9_-]+$/;

const AVATAR_EXT_PRIORITY: Record<string, number> = {
  ".webp": 0,
  ".png": 1,
  ".jpg": 2,
  ".jpeg": 3,
};

export interface AvatarEntry {
  id: string;
  url: string;
}

interface AvatarManifest {
  users: AvatarEntry[];
  admin: AvatarEntry[];
  usersById: Record<string, string>;
  adminById: Record<string, string>;
}

async function scanDir(dir: string, urlPrefix: string): Promise<AvatarEntry[]> {
  try {
    const files = await fs.readdir(dir);

    const candidates = files
      .filter((file) => ALLOWED_EXT.includes(path.extname(file).toLowerCase()))
      .filter((file) => {
        const id = path.basename(file, path.extname(file));
        return SAFE_AVATAR_ID.test(id);
      })
      .sort((a, b) => {
        const aId = path.basename(a, path.extname(a));
        const bId = path.basename(b, path.extname(b));

        if (aId !== bId) {
          return aId < bId ? -1 : 1;
        }

        const aExt = path.extname(a).toLowerCase();
        const bExt = path.extname(b).toLowerCase();
        const extOrder =
          (AVATAR_EXT_PRIORITY[aExt] ?? 99) -
          (AVATAR_EXT_PRIORITY[bExt] ?? 99);

        if (extOrder !== 0) return extOrder;
        return a < b ? -1 : a > b ? 1 : 0;
      });

    const seenIds = new Set<string>();
    const avatars: AvatarEntry[] = [];

    for (const file of candidates) {
      const extension = path.extname(file);
      const id = path.basename(file, extension);

      if (seenIds.has(id)) continue;
      seenIds.add(id);

      avatars.push({
        id,
        url: `${urlPrefix}/${file}`,
      });
    }

    return avatars;
  } catch {
    return [];
  }
}

const loadManifest = unstable_cache(
  async (): Promise<AvatarManifest> => {
    const [users, admin] = await Promise.all([
      scanDir(USERS_DIR, "/avatars/users"),
      scanDir(ADMIN_DIR, "/avatars/admin"),
    ]);

    return {
      users,
      admin,
      usersById: Object.fromEntries(users.map((a) => [a.id, a.url])),
      adminById: Object.fromEntries(admin.map((a) => [a.id, a.url])),
    };
  },
  ["avatar-manifest"],
  { tags: ["avatars"], revalidate: 300 }
);

function parseAvatarId(value: string): { scope: "users" | "admin"; id: string } | null {
  const match = value.match(/^(users|admin)\/([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  return { scope: match[1] as "users" | "admin", id: match[2] };
}

function parseLegacyPath(value: string): { scope: "users" | "admin"; id: string } | null {
  const match = value.match(/^\/avatars\/(users|admin)\/([A-Za-z0-9_-]+)\.(?:webp|png|jpe?g)$/i);
  if (!match) return null;
  return { scope: match[1] as "users" | "admin", id: match[2] };
}

function normalizeAvatarValue(value?: string | null): { scope: "users" | "admin"; id: string } | null {
  if (!value) return null;
  return parseAvatarId(value) ?? parseLegacyPath(value);
}

export async function listAvatars(scope: "users" | "admin" | "all" = "users"): Promise<AvatarEntry[]> {
  const manifest = await loadManifest();
  if (scope === "admin") return manifest.admin;
  if (scope === "all") return [...manifest.users, ...manifest.admin];
  return manifest.users;
}

export async function getDefaultAvatarUrl(): Promise<string | null> {
  const manifest = await loadManifest();
  const explicit = manifest.users.find((a) => a.id === "default");
  return explicit?.url ?? manifest.users[0]?.url ?? null;
}

export async function isValidAvatarId(value: string, allowAdmin: boolean): Promise<boolean> {
  const parsed = parseAvatarId(value);
  if (!parsed) return false;
  if (parsed.scope === "admin" && !allowAdmin) return false;

  const manifest = await loadManifest();
  const map = parsed.scope === "admin" ? manifest.adminById : manifest.usersById;
  return Object.prototype.hasOwnProperty.call(map, parsed.id);
}

export async function resolveAvatarUrl(stored?: string | null): Promise<string | null> {
  const parsed = normalizeAvatarValue(stored);
  if (parsed) {
    const manifest = await loadManifest();
    const map = parsed.scope === "admin" ? manifest.adminById : manifest.usersById;
    if (Object.prototype.hasOwnProperty.call(map, parsed.id)) {
      const url = map[parsed.id];
      if (typeof url === "string" && url.length > 0) return url;
    }
  }
  return getDefaultAvatarUrl();
}