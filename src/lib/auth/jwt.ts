import "server-only";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);
    const bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function positiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function getJwtDatabaseId(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const direct = positiveInt(payload.databaseId);
  if (direct) return direct;
  const user = payload.user;
  if (user && typeof user === "object") {
    const id = positiveInt((user as Record<string, unknown>).databaseId);
    if (id) return id;
  }
  const data = payload.data;
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    const dataId = positiveInt(dataRecord.databaseId);
    if (dataId) return dataId;
    const dataUser = dataRecord.user;
    if (dataUser && typeof dataUser === "object") {
      const userId = positiveInt((dataUser as Record<string, unknown>).databaseId);
      if (userId) return userId;
    }
  }
  return null;
}
