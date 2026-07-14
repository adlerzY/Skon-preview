"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductNode, VariationCard } from "@/lib/graphql";
import DeliveryAndPrice from "@/components/product/DeliveryAndPrice";
import VariationSelector from "@/components/product/VariationSelector";
import ProductReviews from "@/components/ProductReviews";
import WishlistButton from "@/components/product/WishlistButton";

interface Props {
  product: ProductNode;
  initialEdition?: string;
  activeRegion?: string;
}

function hasStock(v: VariationCard): boolean {
  return (
    v.parsedPrice != null ||
    (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
    (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled")
  );
}

function isRegionAttr(name: string): boolean {
  const n = name.replace("pa_", "").replace("attribute_", "").toLowerCase();
  return n.includes("region") || n.includes("ریجن");
}

function isDeliveryAttr(name: string, values: string[]): boolean {
  const n = normalize(name);
  if (
    n.includes("delivery") ||
    n.includes("تحویل") ||
    n.includes("روش") ||
    n.includes("method")
  )
    return true;
  return values.some((v) => {
    const val = normalize(v);
    return (
      val.includes("گیفت") ||
      val.includes("مستقیم") ||
      val.includes("کد") ||
      val.includes("gift") ||
      val.includes("direct")
    );
  });
}

function normalize(s: string): string {
  return s.replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase();
}

function GalleryNavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronRight : ChevronLeft;
  const position = direction === "prev" ? "right-4" : "left-4";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`absolute ${position} top-1/2 -translate-y-1/2 z-40 bg-brand-bg text-brand-m_khonsa p-2 border border-brand-surface transition-all opacity-0 group-hover:opacity-100 hover:text-brand-white hover:border-brand-surface_m disabled:opacity-20 disabled:pointer-events-none`}
      aria-label={direction === "prev" ? "تصویر قبلی" : "تصویر بعدی"}
    >
      <Icon width={20} height={60} strokeWidth={2.5} />
    </button>
  );
}

export default function ProductPageClient({
  product,
  initialEdition,
  activeRegion,
}: Props) {
  const variations = product.variationCards ?? [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackOffset, setTrackOffset] = useState(0);
  const effectiveRegion =
    !activeRegion || activeRegion === "$undefined" || activeRegion === "undefined"
      ? "eu-global"
      : activeRegion;

  const groupedAttributes = useMemo(() => {
    const map = new Map<string, Map<string, string>>();

    for (const v of variations) {
      for (const attr of v.attributes ?? []) {
        if (!map.has(attr.name)) map.set(attr.name, new Map());
        if (!map.get(attr.name)!.has(attr.value)) {
          map.get(attr.name)!.set(attr.value, attr.flagUrl ?? "");
        }
      }
    }

    const result: { name: string; values: { value: string; flagUrl: string }[] }[] = [];

    for (const [name, valMap] of map) {
      const vals = Array.from(valMap.entries()).map(([value, flagUrl]) => ({
        value,
        flagUrl,
      }));

      if (!isDeliveryAttr(name, vals.map((v) => v.value)) && !isRegionAttr(name)) {
        result.push({ name, values: vals });
      }
    }

    return result;
  }, [variations]);

  const regionInfo = useMemo<{ name: string; value: string } | null>(() => {
    let attrName = "";
    let matchedValue = "";
    const regionLower = effectiveRegion.toLowerCase();

    outer: for (const v of variations) {
      for (const a of v.attributes ?? []) {
        if (!isRegionAttr(a.name)) continue;
        attrName = a.name;
        const valLower = a.value.toLowerCase();
        const slugLower = a.slug?.toLowerCase() ?? "";

        const matched =
          valLower === regionLower ||
          slugLower === regionLower ||
          ((regionLower === "eu" || regionLower === "eu-global") &&
            (valLower.includes("eu") || valLower.includes("اروپا") || slugLower.includes("eu"))) ||
          (regionLower === "us" &&
            (valLower.includes("us") ||
              valLower.includes("آمریکا") ||
              valLower.includes("امریکا") ||
              slugLower === "us"));

        if (matched) {
          matchedValue = a.value;
          break outer;
        }
      }
    }

    if (!matchedValue && attrName) {
      for (const v of variations) {
        const found = v.attributes?.find((a) => isRegionAttr(a.name));
        if (found) {
          matchedValue = found.value;
          break;
        }
      }
    }

    return attrName && matchedValue ? { name: attrName, value: matchedValue } : null;
  }, [variations, effectiveRegion]);

  const findFirstValidAttributes = useCallback(
    (targetEdition?: string): Record<string, string> => {
      const result: Record<string, string> = {};
      if (regionInfo) result[regionInfo.name] = regionInfo.value;
      if (variations.length === 0 || groupedAttributes.length === 0) return result;

      for (let i = 0; i < groupedAttributes.length; i++) {
        const group = groupedAttributes[i];

        if (i === 0 && targetEdition && group.values.some((v) => v.value === targetEdition)) {
          result[group.name] = targetEdition;
          continue;
        }

        const valid = group.values.find((candidate) =>
          variations.some((v) => {
            const matchesPrev = groupedAttributes
              .slice(0, i)
              .every((g) => v.attributes?.some((a) => a.name === g.name && a.value === result[g.name]));
            const matchesCurrent = v.attributes?.some((a) => a.name === group.name && a.value === candidate.value);
            const matchesRegion = regionInfo
              ? v.attributes?.some((a) => a.name === regionInfo.name && a.value === regionInfo.value)
              : true;
            return matchesPrev && matchesCurrent && matchesRegion && hasStock(v);
          })
        );

        result[group.name] = valid?.value ?? group.values[0]?.value ?? "";
      }

      return result;
    },
    [variations, groupedAttributes, regionInfo]
  );

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() =>
    findFirstValidAttributes(initialEdition)
  );

  useEffect(() => {
    setSelectedAttrs(findFirstValidAttributes(initialEdition));
  }, [findFirstValidAttributes, initialEdition]);

  const combinedAggregateVar = useMemo((): VariationCard | null => {
    if (variations.length === 0) {
      if (product.parsedPrice == null) return null;
      return {
        databaseId: product.databaseId,
        name: product.name,
        slug: product.slug,
        price: String(product.parsedPrice),
        regularPrice: String(product.parsedRegularPrice ?? product.parsedPrice),
        salePrice: "",
        imageUrl: product.image?.sourceUrl ?? "",
        attributes: [],
        giftPriceToman: "disabled",
        codePriceToman: "disabled",
        parsedPrice: product.parsedPrice,
        parsedRegularPrice: product.parsedRegularPrice ?? product.parsedPrice,
        parsedGiftPrice: "disabled",
        parsedGiftRegularPrice: "disabled",
        parsedCodePrice: "disabled",
        parsedCodeRegularPrice: "disabled",
      };
    }

    const matching = variations.filter((v) => {
      const matchesVisible = groupedAttributes.every((g) => {
        const attr = v.attributes?.find((a) => a.name === g.name);
        return attr ? attr.value === selectedAttrs[g.name] : true;
      });
      const matchesRegion = regionInfo
        ? v.attributes?.some((a) => a.name === regionInfo.name && a.value === regionInfo.value)
        : true;
      return matchesVisible && matchesRegion;
    });

    const candidates =
      matching.length > 0
        ? matching
        : variations.filter((v) =>
            regionInfo ? v.attributes?.some((a) => a.name === regionInfo.name && a.value === regionInfo.value) : true
          );

    if (candidates.length === 0) return variations[0] ?? null;

    let accPrice: number | null = null;
    let accRegularPrice: number | null = null;
    let accGift: number | "disabled" = "disabled";
    let accGiftRegular: number | "disabled" = "disabled";
    let accCode: number | "disabled" = "disabled";
    let accCodeRegular: number | "disabled" = "disabled";

    for (const mv of candidates) {
      if (mv.parsedPrice != null && (accPrice === null || mv.parsedPrice < accPrice)) {
        accPrice = mv.parsedPrice;
        accRegularPrice = mv.parsedRegularPrice ?? mv.parsedPrice;
      }
      if (typeof mv.parsedGiftPrice === "number" && (accGift === "disabled" || mv.parsedGiftPrice < (accGift as number))) {
        accGift = mv.parsedGiftPrice;
        accGiftRegular = typeof mv.parsedGiftRegularPrice === "number" ? mv.parsedGiftRegularPrice : mv.parsedGiftPrice;
      }
      if (typeof mv.parsedCodePrice === "number" && (accCode === "disabled" || mv.parsedCodePrice < (accCode as number))) {
        accCode = mv.parsedCodePrice;
        accCodeRegular = typeof mv.parsedCodeRegularPrice === "number" ? mv.parsedCodeRegularPrice : mv.parsedCodePrice;
      }

      const comboText = mv.attributes?.map((a) => a.value.toLowerCase()).join(" ") ?? "";
      if ((comboText.includes("گیفت") || comboText.includes("gift")) && mv.parsedPrice != null && accGift === "disabled") {
        accGift = mv.parsedPrice;
        accGiftRegular = mv.parsedRegularPrice ?? mv.parsedPrice;
      }
      if ((comboText.includes("کد") || comboText.includes("code")) && mv.parsedPrice != null && accCode === "disabled") {
        accCode = mv.parsedPrice;
        accCodeRegular = mv.parsedRegularPrice ?? mv.parsedPrice;
      }
    }

    return {
      ...candidates[0],
      parsedPrice: accPrice,
      parsedRegularPrice: accRegularPrice,
      parsedGiftPrice: accGift,
      parsedGiftRegularPrice: accGiftRegular,
      parsedCodePrice: accCode,
      parsedCodeRegularPrice: accCodeRegular,
    };
  }, [variations, selectedAttrs, groupedAttributes, regionInfo, product]);

  const allGalleryImages = useMemo(() => {
    const seen = new Set<string>();
    const images: string[] = [];

    const add = (url: string | undefined | null) => {
      const trimmed = url?.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        images.push(trimmed);
      }
    };

    add(product.image?.sourceUrl);
    for (const v of variations) add(v.imageUrl);
    for (const g of product.galleryImages?.nodes ?? []) add(g.sourceUrl);

    return images;
  }, [product, variations]);

  const firstBranchVarImageUrl = useMemo(() => {
    if (variations.length === 0 || groupedAttributes.length === 0) return null;
    const firstGroup = groupedAttributes[0];
    const selectedVal = selectedAttrs[firstGroup.name];
    return (
      variations.find((v) => v.attributes?.some((a) => a.name === firstGroup.name && a.value === selectedVal) && v.imageUrl)
        ?.imageUrl?.trim() ?? null
    );
  }, [variations, groupedAttributes, selectedAttrs]);

  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

  const displayImage =
    selectedGalleryImage || firstBranchVarImageUrl || product.image?.sourceUrl?.trim() || "/placeholder.jpg";

  const currentIndex = useMemo(() => {
    const idx = allGalleryImages.indexOf(displayImage);
    return idx !== -1 ? idx : 0;
  }, [allGalleryImages, displayImage]);

  useEffect(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const itemWidth = 108;
    const totalWidth = allGalleryImages.length * 100 + (allGalleryImages.length - 1) * 8;
    const maxScroll = Math.max(0, totalWidth - containerWidth);
    const target = currentIndex * itemWidth - containerWidth / 2 + 50;
    setTrackOffset(Math.min(maxScroll, Math.max(0, target)));
  }, [currentIndex, allGalleryImages]);

  const handleAttrSelect = useCallback(
    (name: string, val: string) => {
      setSelectedAttrs((prev) => {
        const draft = { ...prev, [name]: val };
        if (regionInfo) draft[regionInfo.name] = regionInfo.value;

        const changeIdx = groupedAttributes.findIndex((g) => g.name === name);

        for (let i = changeIdx + 1; i < groupedAttributes.length; i++) {
          const nextGroup = groupedAttributes[i];
          const stillValid = variations.some((v) => {
            const upToHere = groupedAttributes
              .slice(0, i + 1)
              .every((g) => v.attributes?.some((a) => a.name === g.name && a.value === draft[g.name]));
            const matchesRegion = regionInfo
              ? v.attributes?.some((a) => a.name === regionInfo.name && a.value === regionInfo.value)
              : true;
            return upToHere && matchesRegion && hasStock(v);
          });

          if (!stillValid) {
            const fallback = nextGroup.values.find((cand) =>
              variations.some((v) => {
                const pastLayers = groupedAttributes
                  .slice(0, i)
                  .every((g) => v.attributes?.some((a) => a.name === g.name && a.value === draft[g.name]));
                const matchesCand = v.attributes?.some((a) => a.name === nextGroup.name && a.value === cand.value);
                const matchesRegion = regionInfo
                  ? v.attributes?.some((a) => a.name === regionInfo.name && a.value === regionInfo.value)
                  : true;
                return pastLayers && matchesCand && matchesRegion && hasStock(v);
              })
            );
            draft[nextGroup.name] = fallback?.value ?? nextGroup.values[0]?.value ?? "";
          }
        }

        if (changeIdx === 0) setSelectedGalleryImage(null);
        return draft;
      });
    },
    [groupedAttributes, variations, regionInfo]
  );

  const category = product.productCategories?.nodes?.[0];

  return (
    <div className="flex flex-col gap-12 w-full min-h-screen" dir="rtl">
      <div className="flex justify-start">
        <WishlistButton productId={product.databaseId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full">
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          <div>
            {category?.image?.sourceUrl && (
              <div className="relative w-8 h-8 overflow-hidden mb-3">
                <Image src={category.image.sourceUrl} alt={category.name} fill className="object-cover" />
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-black text-brand-active leading-tight">{product.name}</h1>
            {product.shortNotify && (
              <div className="mt-3 bg-brand-zard text-brand-menu text-xs px-3 py-2.5 font-medium border-r-4 border-brand-blue">
                {product.shortNotify}
              </div>
            )}
          </div>

          <VariationSelector
            groupedAttributes={groupedAttributes}
            selectedAttrs={selectedAttrs}
            onAttributeSelect={handleAttrSelect}
            variations={variations}
            regionInfo={regionInfo}
          />

          <DeliveryAndPrice
            selectedVariation={combinedAggregateVar}
            productId={product.databaseId}
            productName={product.name}
            selectedAttrs={selectedAttrs}
            groupedAttributes={groupedAttributes}
            regionInfo={regionInfo}
          />
        </div>
        <div className="lg:col-span-8 lg:sticky lg:top-6 h-fit flex flex-col gap-6 w-full">
          <div className="relative w-full aspect-[16/9] bg-brand-surface overflow-hidden border border-brand-surface_hover shadow-lg group">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              priority
              quality={90}
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
            {allGalleryImages.length > 1 && (
              <>
                <GalleryNavButton
                  direction="prev"
                  disabled={currentIndex === 0}
                  onClick={() => setSelectedGalleryImage(allGalleryImages[currentIndex - 1])}
                />
                <GalleryNavButton
                  direction="next"
                  disabled={currentIndex === allGalleryImages.length - 1}
                  onClick={() => setSelectedGalleryImage(allGalleryImages[currentIndex + 1])}
                />
              </>
            )}
          </div>

          {allGalleryImages.length > 1 && (
            <div ref={containerRef} className="relative w-full overflow-hidden py-1" dir="rtl">
              <div
                className="flex transition-transform duration-300 ease-in-out will-change-transform"
                style={{ gap: "8px", transform: `translateX(${trackOffset}px)` }}
              >
                {allGalleryImages.map((imgUrl, idx) => (
                  <button
                    key={imgUrl}
                    type="button"
                    onClick={() => setSelectedGalleryImage(imgUrl)}
                    className={`relative w-[100px] aspect-video flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                      idx === currentIndex
                        ? "border-brand-blue opacity-100 ring-2 ring-brand-blue/60 shadow-[0_0_12px_rgba(0,116,224,0.3)]"
                        : "border-brand-surface_hover opacity-40 hover:opacity-80"
                    }`}
                    aria-label={`تصویر ${idx + 1}`}
                  >
                    <Image src={imgUrl} alt={`گالری ${idx + 1}`} fill quality={75} className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.shortDescription && (
            <div className="bg-brand-menu p-6 border border-brand-surface_hover">
              <div
                className="text-brand-surface_m text-sm leading-8 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: product.shortDescription }}
              />
            </div>
          )}
        </div>
      </div>

      {(product.secondaryGallery?.length ?? 0) > 0 && (
        <div className="w-full border-t border-brand-surface_hover pt-8 flex flex-col gap-6">
          <h2 className="text-xl font-black text-brand-active border-r-4 border-brand-blue pr-3">آیتم‌های محصول</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.secondaryGallery!.map((item, index) => (
              <div key={index} className="bg-brand-menu border border-brand-surface_hover flex flex-col overflow-hidden shadow-md">
                {item.imageUrl && (
                  <div className="relative w-full aspect-[16/9] bg-brand-surface">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      quality={85}
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                )}
                {item.description && <p className="text-brand-surface_m text-xs leading-7 p-4">{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {product.description && (
        <div className="w-full border-t border-brand-surface_hover pt-8 flex flex-col gap-6">
          <h2 className="text-xl font-black text-brand-active border-r-4 border-brand-blue pr-3">توضیحات تکمیلی محصول</h2>
          <div
            className="text-brand-surface_m text-sm leading-8 prose prose-invert max-w-none bg-brand-menu p-6 border border-brand-surface_hover"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      <ProductReviews
        productId={product.databaseId}
        reviews={product.reviews?.nodes}
        averageRating={product.averageRating ?? 0}
        reviewCount={product.reviewCount}
      />
    </div>
  );
}