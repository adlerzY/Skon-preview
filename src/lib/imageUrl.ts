export function safeImageUrl(url?: string | null): string {
  if (!url) return "";
  return /[^\x21-\x7E]/.test(url) ? encodeURI(url) : url;
}