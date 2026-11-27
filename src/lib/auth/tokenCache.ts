import "server-only";
import { createHash } from "node:crypto";

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const GLOBAL_KEY = Symbol.for("arena2battle.auth.token-caches");
const globalState = globalThis as typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, Map<string, { expiresAt: number }>>;
};
const stores = globalState[GLOBAL_KEY] ?? (globalState[GLOBAL_KEY] = new Map());

export function tokenKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createTokenCache<T>(name: string, ttlMs: number, limit = 500) {
  let raw = stores.get(name);
  if (!raw) {
    raw = new Map();
    stores.set(name, raw);
  }
  const store = raw as Map<string, Entry<T>>;

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T): void {
      const now = Date.now();
      if (store.size >= limit) {
        for (const [entryKey, entry] of store) {
          if (entry.expiresAt <= now) store.delete(entryKey);
        }
        if (store.size >= limit) store.clear();
      }
      store.set(key, { value, expiresAt: now + ttlMs });
    },
    delete(key: string): void {
      store.delete(key);
    },
  };
}

export function invalidateToken(token?: string | null): void {
  if (!token) return;
  const key = tokenKey(token);
  for (const store of stores.values()) store.delete(key);
}