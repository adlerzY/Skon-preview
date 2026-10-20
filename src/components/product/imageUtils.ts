export function stripSizeSuffix(url: string): string {
  return url.replace(/-\d+x\d+(?=\.[a-zA-Z0-9]+(?:[?#].*)?$)/, "");
}

export function collectImages(
  sources: ReadonlyArray<string | null | undefined>,
  limit: number = Number.POSITIVE_INFINITY
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const source of sources) {
    const url = source?.trim();
    if (!url) continue;

    const key = stripSizeSuffix(url);
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(url);
    if (result.length >= limit) break;
  }

  return result;
}