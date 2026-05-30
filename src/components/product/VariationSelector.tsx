"use client";

import React from "react";
import Image from "next/image";
import { VariationCard } from "@/lib/wp-graphql";

interface VariationSelectorProps {
  groupedAttributes: { name: string; values: string[] }[];
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

  const getHoverImageForValue = (attrName: string, attrValue: string) => {
    const matchedVar = variations.find(v => 
      v.attributes?.some(a => a.name === attrName && a.value === attrValue) && v.imageUrl
    );
    return matchedVar ? matchedVar.imageUrl : null;
  };

  const isVariationInStockGlobally = (v: VariationCard) => {
    return (
      (v.parsedPrice != null) ||
      (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
      (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled")
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {groupedAttributes.map((group, currentLayerIdx) => {
        const cleanName = group.name.replace('pa_', '').replace('attribute_', '');
        
        const processedValues = group.values.map(btnValue => {
          const isValidBtn = variations.some(v => {
            
            const confirmsThisBtnVal = v.attributes?.some(a => a.name === group.name && a.value === btnValue);
            if (!confirmsThisBtnVal) return false;
            
            for (let parentStepIdx = 0; parentStepIdx < currentLayerIdx; parentStepIdx++) {
               const upperG = groupedAttributes[parentStepIdx];
               const currentMandatoryChoiceFromUser = selectedAttrs[upperG.name];
               const adheresToUpstreamRule = v.attributes?.some(a => a.name === upperG.name && a.value === currentMandatoryChoiceFromUser);
               
               if (!adheresToUpstreamRule) return false;
            }
            
            return isVariationInStockGlobally(v);
          });

          return { value: btnValue, isValidBtn };
        });

        if (processedValues.length === 0) return null;

        return (
          <div key={group.name} className="flex flex-col gap-3">
            <span className="text-brand-surface_m text-[13px] font-bold uppercase tracking-wide">
              انتخاب {cleanName}:
            </span>
            
            <div className="grid grid-cols-2 gap-2">
              {processedValues.map(({ value: val, isValidBtn }) => {
                const isSelected = selectedAttrs[group.name] === val;
                const miniImage = currentLayerIdx === 0 ? getHoverImageForValue(group.name, val) : null;
                
                return (
                  <div key={val} className="relative group/var flex flex-col">
                    <button
                      type="button"
                      disabled={!isValidBtn}
                      onClick={() => onAttributeSelect(group.name, val)}
                      className={`p-3 text-sm font-medium border rounded-xl transition-all duration-200 text-center relative overflow-hidden ${
                        !isValidBtn 
                          ? "opacity-30 cursor-not-allowed bg-brand-bg border-brand-surface_hover/50 text-brand-surface_m/50"
                          : isSelected
                          ? "bg-brand-active border-brand-active text-brand-bg font-bold shadow-[0_0_15px_rgba(248,245,249,0.15)]"
                          : "bg-brand-surface border-brand-surface_hover text-brand-m_khonsa hover:border-brand-m_khonsa"
                      }`}
                    >
                      <span className="relative z-10">{val}</span>
                    </button>
                    
                    {miniImage && isValidBtn && (
                      <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-32 aspect-video bg-brand-bg border border-brand-surface_hover rounded-lg overflow-hidden opacity-0 invisible group-hover/var:opacity-100 group-hover/var:visible transition-all duration-200 z-20 shadow-xl pointer-events-none">
                        <Image src={miniImage} alt={val} fill className="object-cover" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-brand-surface_hover"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}