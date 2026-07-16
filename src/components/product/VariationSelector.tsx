"use client";

import { VariationCard } from "@/lib/graphql";
import { PriceDisplay } from "./PriceDisplay";

interface AttributeValue {
  value: string;
  flagUrl?: string;
}

interface GroupedAttribute {
  name: string;
  values: AttributeValue[];
}

interface Props {
  groupedAttributes: GroupedAttribute[];
  selectedAttrs: Record<string, string>;
  onAttributeSelect: (name: string, value: string) => void;
  variations: VariationCard[];
  regionInfo?: { name: string; value: string } | null;
}

interface OptionState {
  available: boolean;
  price: number | null;
  regularPrice: number | null;
}

function isCodeViable(v: VariationCard): boolean {
  if (v.parsedCodePrice == null || v.parsedCodePrice === "disabled") return false;
  if (typeof v.codeStockCount === "number" && v.codeStockCount <= 0) return false;
  return true;
}

function checkStockGlobally(v: VariationCard): boolean {
  return (
    v.parsedPrice != null ||
    (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
    isCodeViable(v)
  );
}

export default function VariationSelector({
  groupedAttributes,
  selectedAttrs,
  onAttributeSelect,
  variations,
  regionInfo,
}: Props) {

  const getOptionState = (groupName: string, optionValue: string, groupIndex: number): OptionState => {
    let available = false;
    let best: { price: number; regularPrice: number | null } | null = null;

    for (const v of variations) {
      if (regionInfo) {
        const hasRegion = v.attributes?.some(
          (a) => a.name === regionInfo.name && a.value === regionInfo.value
        );
        if (!hasRegion) continue;
      }

      const matchesPreceding = groupedAttributes
        .slice(0, groupIndex)
        .every((prevGroup) =>
          v.attributes?.some(
            (a) => a.name === prevGroup.name && a.value === selectedAttrs[prevGroup.name]
          )
        );
      if (!matchesPreceding) continue;

      const matchesCurrent = v.attributes?.some(
        (a) => a.name === groupName && a.value === optionValue
      );
      if (!matchesCurrent) continue;

      if (!checkStockGlobally(v)) continue;
      available = true;

      const candidates: Array<{ price: number; regularPrice: number | null }> = [];
      if (v.parsedPrice != null) {
        candidates.push({ price: v.parsedPrice, regularPrice: v.parsedRegularPrice ?? null });
      }
      if (typeof v.parsedGiftPrice === "number") {
        candidates.push({
          price: v.parsedGiftPrice,
          regularPrice: typeof v.parsedGiftRegularPrice === "number" ? v.parsedGiftRegularPrice : null,
        });
      }
      if (isCodeViable(v) && typeof v.parsedCodePrice === "number") {
        candidates.push({
          price: v.parsedCodePrice,
          regularPrice: typeof v.parsedCodeRegularPrice === "number" ? v.parsedCodeRegularPrice : null,
        });
      }

      for (const c of candidates) {
        if (!best || c.price < best.price) best = c;
      }
    }

    return { available, price: best?.price ?? null, regularPrice: best?.regularPrice ?? null };
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {groupedAttributes.map((group, groupIdx) => {
        const cleanGroupName = group.name.replace("pa_", "").replace("attribute_", "");

        return (
          <div key={group.name} className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-brand-surface_m">
              انتخاب {cleanGroupName}:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.values.map((opt) => {
                const isSelected = selectedAttrs[group.name] === opt.value;
                const state = getOptionState(group.name, opt.value, groupIdx);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => state.available && onAttributeSelect(group.name, opt.value)}
                    disabled={!state.available}
                    className={`relative aspect-square flex flex-col items-center justify-center gap-2 p-3 border-2 text-center transition-all duration-200 ${
                      isSelected
                        ? "bg-brand-blue/10 border-brand-blue shadow-[0_0_16px_rgba(0,116,224,0.25)]"
                        : state.available
                        ? "bg-brand-menu border-brand-surface_hover hover:border-brand-blue/60"
                        : "bg-brand-menu/40 border-brand-surface/20 cursor-not-allowed"
                    }`}
                  >
                    {opt.flagUrl && (
                      <img
                        src={opt.flagUrl}
                        alt=""
                        className={`w-7 h-5 object-cover rounded-sm ${!state.available ? "opacity-20" : ""}`}
                      />
                    )}
                    <span
                      className={`font-bold text-sm leading-tight ${
                        isSelected
                          ? "text-brand-active"
                          : state.available
                          ? "text-brand-m_khonsa"
                          : "text-brand-surface_m/30 line-through"
                      }`}
                    >
                      {opt.value}
                    </span>

                    {state.available ? (
                      <PriceDisplay price={state.price} regularPrice={state.regularPrice ?? undefined} compact />
                    ) : (
                      <span className="text-[11px] font-bold text-red-500/70">ناموجود</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}