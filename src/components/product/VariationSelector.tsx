"use client";

import { useMemo } from "react";
import Image from "next/image";
import { VariationCard } from "@/lib/graphql";
import { PriceDisplay } from "./PriceDisplay";
import SelectionMark from "./SelectionMark";
import type { DeliveryType } from "./useProductDelivery";
import {
  hasStock,
  isCodeViable,
  matchesRegion,
  matchesThroughGroup,
} from "./variationMatcher";

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
  deliveryType?: DeliveryType | null;
}

interface PriceTier {
  price: number;
  regularPrice: number | null;
}

interface OptionState {
  available: boolean;
  price: number | null;
  regularPrice: number | null;
}

function lowest(current: PriceTier | null, next: PriceTier): PriceTier {
  return current === null || next.price < current.price ? next : current;
}

export default function VariationSelector({
  groupedAttributes,
  selectedAttrs,
  onAttributeSelect,
  variations,
  regionInfo,
  deliveryType,
}: Props) {
  const stateMap = useMemo(() => {
    const map = new Map<string, OptionState>();

    groupedAttributes.forEach((group, groupIndex) => {
      group.values.forEach((opt) => {
        const eligible = variations.filter((variation) => {
          if (!matchesRegion(variation, regionInfo ?? null)) return false;

          if (
            !matchesThroughGroup(
              variation,
              groupedAttributes,
              selectedAttrs,
              groupIndex
            )
          ) {
            return false;
          }

          return variation.attributes?.some(
            (attr) => attr.name === group.name && attr.value === opt.value
          ) ?? false;
        });

        const exactMatches = eligible.filter((variation) =>
          groupedAttributes.every((otherGroup) => {
            if (otherGroup.name === group.name) return true;

            return (
              variation.attributes?.some(
                (attr) =>
                  attr.name === otherGroup.name &&
                  attr.value === selectedAttrs[otherGroup.name]
              ) ?? false
            );
          })
        );

        const useExactMatches = exactMatches.some(hasStock);
        const priceSource = useExactMatches ? exactMatches : eligible;
        const available = eligible.some(hasStock);

        const byType: Record<DeliveryType, PriceTier | null> = {
          direct: null,
          gift: null,
          code: null,
        };

        for (const variation of priceSource) {
          if (!hasStock(variation)) continue;

          if (variation.parsedPrice != null) {
            byType.direct = lowest(byType.direct, {
              price: variation.parsedPrice,
              regularPrice: variation.parsedRegularPrice ?? null,
            });
          }

          if (typeof variation.parsedGiftPrice === "number") {
            byType.gift = lowest(byType.gift, {
              price: variation.parsedGiftPrice,
              regularPrice:
                typeof variation.parsedGiftRegularPrice === "number"
                  ? variation.parsedGiftRegularPrice
                  : null,
            });
          }

          if (
            isCodeViable(variation) &&
            typeof variation.parsedCodePrice === "number"
          ) {
            byType.code = lowest(byType.code, {
              price: variation.parsedCodePrice,
              regularPrice:
                typeof variation.parsedCodeRegularPrice === "number"
                  ? variation.parsedCodeRegularPrice
                  : null,
            });
          }
        }

        const overall = [
          byType.direct,
          byType.gift,
          byType.code,
        ].reduce<PriceTier | null>(
          (acc, tier) => (tier ? lowest(acc, tier) : acc),
          null
        );

        const picked = deliveryType ? byType[deliveryType] : overall;

        map.set(`${group.name}::${opt.value}`, {
          available,
          price: picked?.price ?? null,
          regularPrice: picked?.regularPrice ?? null,
        });
      });
    });

    return map;
  }, [
    groupedAttributes,
    variations,
    selectedAttrs,
    regionInfo,
    deliveryType,
  ]);

  return (
    <div className="flex w-full flex-col gap-5">
      {groupedAttributes.map((group, groupIndex) => {
        const cleanGroupName = group.name
          .replace("pa_", "")
          .replace("attribute_", "");

        return (
          <div
            key={group.name}
            role="radiogroup"
            aria-label={cleanGroupName}
            className={`flex min-w-0 flex-col gap-2 ${
              groupIndex > 0 ? "border-t border-brand-surface_hover/60 pt-5" : ""
            }`}
          >
            {group.values.map((opt) => {
              const isSelected = selectedAttrs[group.name] === opt.value;

              const state = stateMap.get(`${group.name}::${opt.value}`) ?? {
                available: false,
                price: null,
                regularPrice: null,
              };

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!state.available}
                  onClick={() =>
                    state.available && onAttributeSelect(group.name, opt.value)
                  }
                  className={`flex w-full items-center gap-3 border p-5 text-right transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue/60 ${
                    isSelected
                      ? "border-brand-blue bg-brand-blue/10"
                      : state.available
                      ? "border-brand-surface_hover bg-brand-surface hover:border-brand-m_khonsa"
                      : "cursor-not-allowed border-brand-surface_hover/40 bg-brand-surface/40"
                  }`}
                >
                  <SelectionMark selected={isSelected} disabled={!state.available} />

                  {opt.flagUrl && (
                    <Image
                      src={opt.flagUrl}
                      alt=""
                      width={32}
                      height={24}
                      className={`h-6 w-8 shrink-0 rounded-sm object-cover ${
                        !state.available ? "opacity-20" : ""
                      }`}
                    />
                  )}

                  <span
                    className={`flex-1 text-sm font-bold leading-tight ${
                      isSelected
                        ? "text-brand-active"
                        : state.available
                        ? "text-brand-m_khonsa"
                        : "text-brand-surface_m/30 line-through"
                    }`}
                  >
                    {opt.value}
                  </span>

                  {state.available && state.price !== null ? (
                    <PriceDisplay
                      price={state.price}
                      regularPrice={state.regularPrice}
                      compact
                    />
                  ) : (
                    <span className="shrink-0 text-[11px] font-bold text-red-500/70">
                      {state.available ? "در این روش ناموجود" : "ناموجود"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}