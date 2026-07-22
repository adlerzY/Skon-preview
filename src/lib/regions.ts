export const KNOWN_REGIONS = ["eu", "us", "tr"];
export const DEFAULT_REGION = "eu";

export function isKnownRegion(value?: string | null): value is string {
  return !!value && KNOWN_REGIONS.includes(value.toLowerCase());
}