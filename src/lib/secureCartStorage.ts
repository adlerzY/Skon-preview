"use client";

const STORAGE_PREFIX = "a2b_cred_";
const HANDOFF_KEY = "a2b_login_handoff";
const CREDENTIAL_TTL_MS = 24 * 60 * 60 * 1000;
const HANDOFF_TTL_MS = 10 * 60 * 1000;

interface StoredCredentialEnvelope {
  version: 1;
  savedAt: number;
  credentials: StoredCredentials;
}

export interface StoredCredentials {
  email?: string;
  battleTag?: string;
}

export interface HandoffCredentials extends StoredCredentials {
  password?: string;
}

interface HandoffEnvelope {
  savedAt: number;
  items: Record<string, HandoffCredentials>;
}

function persistedCredentials(credentials: StoredCredentials): StoredCredentials {
  return {
    ...(credentials.email ? { email: credentials.email } : {}),
    ...(credentials.battleTag ? { battleTag: credentials.battleTag } : {}),
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function saveCredentials(itemId: string, credentials: StoredCredentials): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(
      STORAGE_PREFIX + itemId,
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        credentials: persistedCredentials(credentials),
      } satisfies StoredCredentialEnvelope)
    );
  } catch {}
}

export function getCredentials(itemId: string): StoredCredentials | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + itemId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCredentialEnvelope>;
    if (parsed.version !== 1 || typeof parsed.savedAt !== "number" || !parsed.credentials) {
      window.sessionStorage.removeItem(STORAGE_PREFIX + itemId);
      return null;
    }
    if (Date.now() - parsed.savedAt > CREDENTIAL_TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_PREFIX + itemId);
      return null;
    }
    return parsed.credentials;
  } catch {
    return null;
  }
}

export function removeCredentials(itemId: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_PREFIX + itemId);
  } catch {}
}

export function stashCredentialsForLogin(
  items: ReadonlyArray<{ id: string; customFields?: HandoffCredentials }>
): void {
  if (!isBrowser()) return;
  const collected: Record<string, HandoffCredentials> = {};
  for (const item of items) {
    const fields = item.customFields;
    if (!fields) continue;
    const entry: HandoffCredentials = {
      ...(fields.email ? { email: fields.email } : {}),
      ...(fields.password ? { password: fields.password } : {}),
      ...(fields.battleTag ? { battleTag: fields.battleTag } : {}),
    };
    if (Object.keys(entry).length > 0) collected[item.id] = entry;
  }
  try {
    if (Object.keys(collected).length === 0) {
      window.sessionStorage.removeItem(HANDOFF_KEY);
      return;
    }
    window.sessionStorage.setItem(
      HANDOFF_KEY,
      JSON.stringify({ savedAt: Date.now(), items: collected } satisfies HandoffEnvelope)
    );
  } catch {}
}

export function consumeLoginHandoff(): Record<string, HandoffCredentials> {
  if (!isBrowser()) return {};
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    window.sessionStorage.removeItem(HANDOFF_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<HandoffEnvelope>;
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > HANDOFF_TTL_MS) return {};
    return parsed.items && typeof parsed.items === "object" ? parsed.items : {};
  } catch {
    return {};
  }
}

export function clearAllCredentials(): void {
  if (!isBrowser()) return;
  try {
    const keys: string[] = [HANDOFF_KEY];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {}
}