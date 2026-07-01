"use client";

import { VariationCard } from "@/lib/graphql";

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

const checkStockGlobally = (v: VariationCard) => {
  return (
    v.parsedPrice != null ||
    (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
    (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled")
  );
};

export default function VariationSelector({
  groupedAttributes,
  selectedAttrs,
  onAttributeSelect,
  variations,
  regionInfo,
}: Props) {
  
  const isOptionAvailable = (groupName: string, optionValue: string, groupIndex: number) => {
    return variations.some((v) => {
      if (regionInfo) {
        const hasRegion = v.attributes?.some(
          (a) => a.name === regionInfo.name && a.value === regionInfo.value
        );
        if (!hasRegion) return false;
      }

      const matchesPreceding = groupedAttributes
        .slice(0, groupIndex)
        .every((prevGroup) => {
          return v.attributes?.some(
            (a) => a.name === prevGroup.name && a.value === selectedAttrs[prevGroup.name]
          );
        });

      if (!matchesPreceding) return false;

      const matchesCurrent = v.attributes?.some(
        (a) => a.name === groupName && a.value === optionValue
      );

      if (!matchesCurrent) return false;

      return checkStockGlobally(v);
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {groupedAttributes.map((group, groupIdx) => {
        const cleanGroupName = group.name.replace("pa_", "").replace("attribute_", "");
        
        return (
          <div key={group.name} className="flex flex-col gap-2">
            <span className="text-xs font-bold text-brand-surface_m">
              انتخاب {cleanGroupName}:
            </span>
            <div className="flex flex-wrap gap-2">
              {group.values.map((opt) => {
                const isSelected = selectedAttrs[group.name] === opt.value;
                const isAvailable = isOptionAvailable(group.name, opt.value, groupIdx);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => isAvailable && onAttributeSelect(group.name, opt.value)}
                    disabled={!isAvailable}
                    className={`px-4 py-2.5 text-xs font-semibold border transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? "bg-brand-blue border-brand-blue text-brand-white shadow-[0_0_10px_rgba(0,116,224,0.2)]"
                        : isAvailable
                        ? "bg-brand-menu border-brand-surface_hover text-brand-surface_m hover:border-brand-blue hover:text-brand-active"
                        : "bg-brand-menu/40 border-brand-surface/20 text-brand-surface_m/30 cursor-not-allowed line-through"
                    }`}
                  >
                    {opt.flagUrl && (
                      <img
                        src={opt.flagUrl}
                        alt=""
                        className={`w-4 h-3.5 object-cover rounded-sm ${!isAvailable ? "opacity-20" : ""}`}
                      />
                    )}
                    {opt.value}
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