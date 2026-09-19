export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decodedBinary = atob(padded);
    const bytes = Uint8Array.from(decodedBinary, (c) => c.charCodeAt(0));
    const jsonString = new TextDecoder().decode(bytes);
    const payload = JSON.parse(jsonString) as unknown;
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function numericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

export function getJwtDatabaseId(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const direct = numericId(payload.databaseId ?? payload.userId);
  if (direct) return direct;

  const user = payload.user;
  if (user && typeof user === "object") {
    const nested = numericId((user as Record<string, unknown>).databaseId ?? (user as Record<string, unknown>).id);
    if (nested) return nested;
  }

  const data = payload.data;
  if (data && typeof data === "object") {
    const nestedUser = (data as Record<string, unknown>).user;
    if (nestedUser && typeof nestedUser === "object") {
      const nested = numericId(
        (nestedUser as Record<string, unknown>).databaseId ?? (nestedUser as Record<string, unknown>).id,
      );
      if (nested) return nested;
    }
  }

  return null;
}
