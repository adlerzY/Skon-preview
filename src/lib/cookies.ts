interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
}

export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setClientCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;
  const { days = 365, path = "/", sameSite = "Lax" } = options;
  const maxAge = days * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}${secure}`;
}

export function removeClientCookie(name: string, path: string = "/"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=${path}; max-age=0`;
}