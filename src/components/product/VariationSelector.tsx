"use client";

import React from "react";
import Image from "next/image";
import { VariationCard } from "@/lib/wp-graphql";

interface AttrValueItem {
  value: string;
  flagUrl: string;
}

interface VariationSelectorProps {
  groupedAttributes: { name: string; values: AttrValueItem[] }[];
  selectedAttrs: Record<string, string>;
  onAttributeSelect: (name: string, value: string) => void;
  variations: VariationCard[];
}

export default function VariationSelector({
  groupedAttributes,
  selectedAttrs,
  onAttributeSelect,
  variations
}: VariationSelectorProps) {
  if (!groupedAttributes || groupedAttributes.length === 0) return null;

  const isVariationInStockGlobally = (v: VariationCard) => {
    return (
      (v.parsedPrice != null) ||
      (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
      (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled")
    );
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {groupedAttributes.map((group, currentLayerIdx) => {
        const cleanName = group.name.replace('pa_', '').replace('attribute_', '');
        const isRegion = cleanName.toLowerCase().includes('region') || cleanName.includes('ریجن');
        
        const processedValues = group.values.map(btnValue => {
          const isValidBtn = variations.some(v => {
            const confirmsThisBtnVal = v.attributes?.some(a => a.name === group.name && a.value === btnValue.value);
            if (!confirmsThisBtnVal) return false;
            for (let parentStepIdx = 0; parentStepIdx < currentLayerIdx; parentStepIdx++) {
               const upperG = groupedAttributes[parentStepIdx];
               const currentMandatoryChoiceFromUser = selectedAttrs[upperG.name];
               const adheresToUpstreamRule = v.attributes?.some(a => a.name === upperG.name && a.value === currentMandatoryChoiceFromUser);
               if (!adheresToUpstreamRule) return false;
            }
            return isVariationInStockGlobally(v);
          });
          return { item: btnValue, isValidBtn };
        });

        if (processedValues.length === 0) return null;

        return (
          <div key={group.name} className="flex flex-col gap-2 w-full">
            <span className="text-brand-surface_m text-[13px] font-bold">
              انتخاب {cleanName}:
            </span>

            {/* ریجن‌ها در دسکتاپ تک ردیف، لپ‌تاپ به پایین گرید ۲ ستونه */}
            <div 
              className={
                isRegion 
                  ? "grid grid-cols-2 lg:flex lg:flex-row lg:flex-wrap gap-2 w-full"
                  : "grid grid-cols-2 sm:grid-cols-3 gap-2 w-full"
              }
            >
              {processedValues.map(({ item, isValidBtn }) => {
                const isSelected = selectedAttrs[group.name] === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={!isValidBtn}
                    onClick={() => {
                      if (isValidBtn) {
                        onAttributeSelect(group.name, item.value);
                      }
                    }}
                    className={`p-3 text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center gap-2 border rounded-sm lg:flex-1 min-w-[90px] ${
                      !isValidBtn
                        ? "opacity-25 cursor-not-allowed bg-brand-bg text-brand-surface_m/40 border-brand-surface_hover/30"
                        : isSelected
                        ? "bg-brand-blue/10 border-brand-blue text-brand-blue font-bold shadow-[0_0_12px_rgba(0,116,224,0.15)]"
                        : "bg-brand-surface text-brand-m_khonsa border-brand-surface_hover hover:border-brand-white hover:text-brand-active"
                    }`}
                  >
                    {item.flagUrl && (
                      <div className="relative w-7 h-4.5 overflow-hidden rounded-sm flex-shrink-0">
                        <Image src={item.flagUrl} alt={item.value} fill className="object-cover" />
                      </div>
                    )}
                    <span className="text-center">{item.value}</span>
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