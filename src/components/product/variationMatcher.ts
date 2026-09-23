import type { VariationCard } from "@/lib/graphql";
import { regionsMatch } from "@/lib/regions";

export interface GroupedAttribute {
  name: string;
  values: Array<{ value: string; flagUrl?: string }>;
}

export interface RegionInfo {
  name: string;
  value: string;
}

export function normalizeAttributeText(value: string): string {
  return value.replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase();
}

export function isRegionAttr(name: string): boolean {
  const normalized = name.replace("pa_", "").replace("attribute_", "").toLowerCase();
  return normalized.includes("region") || normalized.includes("ریجن");
}

export function isDeliveryAttr(name: string, values: string[]): boolean {
  const normalized = normalizeAttributeText(name);
  if (
    normalized.includes("delivery") ||
    normalized.includes("تحویل") ||
    normalized.includes("روش") ||
    normalized.includes("method")
  ) {
    return true;
  }

  return values.some((value) => {
    const token = normalizeAttributeText(value);
    return (
      token.includes("گیفت") ||
      token.includes("مستقیم") ||
      token.includes("کد") ||
      token.includes("gift") ||
      token.includes("direct")
    );
  });
}

export function isCodeViable(variation: VariationCard): boolean {
  if (variation.parsedCodePrice == null || variation.parsedCodePrice === "disabled") return false;
  if (typeof variation.codeStockCount === "number" && variation.codeStockCount <= 0) return false;
  return true;
}

export function hasStock(variation: VariationCard): boolean {
  return (
    variation.parsedPrice != null ||
    (variation.parsedGiftPrice != null && variation.parsedGiftPrice !== "disabled") ||
    isCodeViable(variation)
  );
}

export function buildGroupedAttributes(variations: VariationCard[]): GroupedAttribute[] {
  const map = new Map<string, Map<string, string>>();

  for (const variation of variations) {
    for (const attr of variation.attributes ?? []) {
      if (!map.has(attr.name)) map.set(attr.name, new Map());
      if (!map.get(attr.name)!.has(attr.value)) {
        map.get(attr.name)!.set(attr.value, attr.flagUrl ?? "");
      }
    }
  }

  return Array.from(map.entries())
    .map(([name, valueMap]) => ({
      name,
      values: Array.from(valueMap.entries()).map(([value, flagUrl]) => ({ value, flagUrl })),
    }))
    .filter(({ name, values }) => !isDeliveryAttr(name, values.map((value) => value.value)) && !isRegionAttr(name));
}

export function findRegionInfo(variations: VariationCard[], effectiveRegion: string): RegionInfo | null {
  let fallback: RegionInfo | null = null;

  for (const variation of variations) {
    for (const attr of variation.attributes ?? []) {
      if (!isRegionAttr(attr.name)) continue;
      if (!fallback) fallback = { name: attr.name, value: attr.value };

      if (
        regionsMatch(attr.value, effectiveRegion) ||
        regionsMatch(attr.slug, effectiveRegion)
      ) {
        return { name: attr.name, value: attr.value };
      }
    }
  }

  return fallback;
}

export function matchesRegion(variation: VariationCard, regionInfo: RegionInfo | null): boolean {
  if (!regionInfo) return true;
  return (variation.attributes ?? []).some(
    (attr) => attr.name === regionInfo.name && regionsMatch(attr.value, regionInfo.value)
  );
}

export function matchesSelection(
  variation: VariationCard,
  groupedAttributes: GroupedAttribute[],
  selectedAttrs: Record<string, string>
): boolean {
  return groupedAttributes.every((group) => {
    const attr = variation.attributes?.find((candidate) => candidate.name === group.name);
    return attr?.value === selectedAttrs[group.name];
  });
}

export function matchesThroughGroup(
  variation: VariationCard,
  groupedAttributes: GroupedAttribute[],
  selectedAttrs: Record<string, string>,
  groupIndex: number
): boolean {
  return groupedAttributes.slice(0, groupIndex).every((group) =>
    variation.attributes?.some(
      (candidate) => candidate.name === group.name && candidate.value === selectedAttrs[group.name]
    ) ?? false
  );
}

export function findFirstValidAttributes(
  variations: VariationCard[],
  groupedAttributes: GroupedAttribute[],
  regionInfo: RegionInfo | null,
  targetEdition?: string
): Record<string, string> {
  const result: Record<string, string> = {};
  if (regionInfo) result[regionInfo.name] = regionInfo.value;
  if (variations.length === 0 || groupedAttributes.length === 0) return result;

  for (let i = 0; i < groupedAttributes.length; i += 1) {
    const group = groupedAttributes[i];

    if (i === 0 && targetEdition && group.values.some((value) => value.value === targetEdition)) {
      result[group.name] = targetEdition;
      continue;
    }

    const valid = group.values.find((candidate) =>
      variations.some((variation) =>
        matchesThroughGroup(variation, groupedAttributes, result, i) &&
        variation.attributes?.some((attr) => attr.name === group.name && attr.value === candidate.value) &&
        matchesRegion(variation, regionInfo) &&
        hasStock(variation)
      )
    );

    result[group.name] = valid?.value ?? group.values[0]?.value ?? "";
  }

  return result;
}

export function findMatchingVariations(
  variations: VariationCard[],
  groupedAttributes: GroupedAttribute[],
  selectedAttrs: Record<string, string>,
  regionInfo: RegionInfo | null
): VariationCard[] {
  const matching = variations.filter(
    (variation) => matchesSelection(variation, groupedAttributes, selectedAttrs) && matchesRegion(variation, regionInfo)
  );

  return matching;
}
