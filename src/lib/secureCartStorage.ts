"use client";

const STORAGE_PREFIX = "a2b_cred_";

export interface StoredCredentials {
  email?: string;
  password?: string;
  battleTag?: string;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function saveCredentials(itemId: string, credentials: StoredCredentials): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + itemId, JSON.stringify(credentials));
  } catch {
  }
}

export function getCredentials(itemId: string): StoredCredentials | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + itemId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removeCredentials(itemId: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_PREFIX + itemId);
  } catch {
  }
}