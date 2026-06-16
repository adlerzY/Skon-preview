"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ProductNode, VariationCard } from "@/lib/graphql";
import DeliveryAndPrice from "@/components/product/DeliveryAndPrice";
import VariationSelector from "@/components/product/VariationSelector";
import ProductReviews from "@/components/ProductReviews";

interface Props {
  product: ProductNode;
  initialEdition?: string;
  activeRegion?: string;
}

const checkStockGlobally = (v: VariationCard) => {
  return (
    v.parsedPrice != null ||
    (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
    (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled")
  );
};

export default function ProductPageClient({ product, initialEdition, activeRegion }: Props) {
  const variations = product.variationCards || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackOffset, setTrackOffset] = useState(0);

  const groupedAttributes = useMemo(() => {
    const map = new Map<string, Set<{ value: string; flagUrl: string }>>();
    variations.forEach(v => {
      v.attributes?.forEach(attr => {
        if (!map.has(attr.name)) map.set(attr.name, new Set());
        const existing = Array.from(map.get(attr.name)!).find(item => item.value === attr.value);
        if (!existing) {
          map.get(attr.name)!.add({ value: attr.value, flagUrl: attr.flagUrl || "" });
        }
      });
    });

    const filteredMap = new Map<string, Set<{ value: string; flagUrl: string }>>();
    map.forEach((values, name) => {
      const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
      const normalizedName = normalize(name);
      const isDeliveryAttr =
        normalizedName.includes('delivery') ||
        normalizedName.includes('تحویل') ||
        normalizedName.includes('روش') ||
        normalizedName.includes('method');
      const isDeliveryVal = Array.from(values).some(item => {
        const v = normalize(item.value);
        return v.includes('گیفت') || v.includes('مستقیم') || v.includes('کد') || v.includes('gift') || v.includes('direct');
      });
      if (!isDeliveryAttr && !isDeliveryVal) {
        filteredMap.set(name, values);
      }
    });

    return Array.from(filteredMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [variations]);

  const findFirstValidAttributes = useCallback(
    (targetEdition?: string): Record<string, string> => {
      const resultAttrs: Record<string, string> = {};
      if (variations.length === 0 || groupedAttributes.length === 0) return resultAttrs;

      for (let i = 0; i < groupedAttributes.length; i++) {
        const group = groupedAttributes[i];
        if (i === 0 && targetEdition && group.values.some(v => v.value === targetEdition)) {
          resultAttrs[group.name] = targetEdition;
          continue;
        }
        const validOpt = group.values.find(candidate =>
          variations.some(v => {
            const matchesPreceding = groupedAttributes.slice(0, i).every(prevG =>
              v.attributes?.some(a => a.name === prevG.name && a.value === resultAttrs[prevG.name])
            );
            const matchesCandidate = v.attributes?.some(a => a.name === group.name && a.value === candidate.value);
            return matchesPreceding && matchesCandidate && checkStockGlobally(v);
          })
        );
        resultAttrs[group.name] = validOpt ? validOpt.value : group.values[0].value;
      }
      return resultAttrs;
    },
    [variations, groupedAttributes]
  );

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() =>
    findFirstValidAttributes(initialEdition)
  );

  useEffect(() => {
    if (initialEdition) {
      setSelectedAttrs(findFirstValidAttributes(initialEdition));
    }
  }, [initialEdition, findFirstValidAttributes]);

  const combinedAggregateVar = useMemo(() => {
    if (variations.length === 0) return null;

    const matchingVars = variations.filter(v =>
      groupedAttributes.every(group => {
        const currentAttrObj = v.attributes?.find(a => a.name === group.name);
        return currentAttrObj ? currentAttrObj.value === selectedAttrs[group.name] : true;
      })
    );

    if (matchingVars.length === 0)
      return variations.find(v => checkStockGlobally(v)) || variations[0];

    let accPrice: number | null = null;
    let accGift: number | 'disabled' = 'disabled';
    let accCode: number | 'disabled' = 'disabled';

    matchingVars.forEach(mv => {
      if (mv.parsedPrice != null && (accPrice === null || mv.parsedPrice < accPrice)) {
        accPrice = mv.parsedPrice;
      }
      if (mv.parsedGiftPrice != null && mv.parsedGiftPrice !== 'disabled') {
        accGift = accGift === 'disabled'
          ? mv.parsedGiftPrice
          : Math.min(accGift as number, mv.parsedGiftPrice as number);
      }
      if (mv.parsedCodePrice != null && mv.parsedCodePrice !== 'disabled') {
        accCode = accCode === 'disabled'
          ? mv.parsedCodePrice
          : Math.min(accCode as number, mv.parsedCodePrice as number);
      }
      const comboText = mv.attributes?.map(a => a.value.toLowerCase()).join(' ') || "";
      if ((comboText.includes('گیفت') || comboText.includes('gift')) && mv.parsedPrice != null && accGift === 'disabled') {
        accGift = mv.parsedPrice;
      }
      if ((comboText.includes('کد') || comboText.includes('code')) && mv.parsedPrice != null && accCode === 'disabled') {
        accCode = mv.parsedPrice;
      }
    });

    return {
      ...matchingVars[0],
      parsedPrice: accPrice,
      parsedGiftPrice: accGift,
      parsedCodePrice: accCode,
    } as VariationCard;
  }, [variations, selectedAttrs, groupedAttributes]);

  const allGalleryImages = useMemo(() => {
    const images = new Set<string>();
    if (product.image?.sourceUrl?.trim()) images.add(product.image.sourceUrl.trim());
    variations.forEach(v => { if (v.imageUrl?.trim()) images.add(v.imageUrl.trim()); });
    product.galleryImages?.nodes?.forEach((g: { sourceUrl: string }) => {
      if (g.sourceUrl?.trim()) images.add(g.sourceUrl.trim());
    });
    return Array.from(images);
  }, [product, variations]);

  const firstBranchVarImageUrl = useMemo(() => {
    if (variations.length === 0 || groupedAttributes.length === 0) return null;
    const firstGroup = groupedAttributes[0];
    const selectedVal = selectedAttrs[firstGroup.name];
    const matched = variations.find(v =>
      v.attributes?.some(a => a.name === firstGroup.name && a.value === selectedVal) && v.imageUrl
    );
    return matched?.imageUrl?.trim() ?? null;
  }, [variations, groupedAttributes, selectedAttrs]);

  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const displayImage = selectedGalleryImage || firstBranchVarImageUrl || product.image?.sourceUrl?.trim() || "/placeholder.jpg";

  const currentIndex = useMemo(() => {
    const idx = allGalleryImages.indexOf(displayImage);
    return idx !== -1 ? idx : 0;
  }, [allGalleryImages, displayImage]);

  const category = product.productCategories?.nodes?.[0];
  const categoryName = category?.name || "بدون دسته";
  const categoryImage = category?.image?.sourceUrl;

  const handlePrevImage = () => {
    if (currentIndex > 0) setSelectedGalleryImage(allGalleryImages[currentIndex - 1]);
  };
  const handleNextImage = () => {
    if (currentIndex < allGalleryImages.length - 1) setSelectedGalleryImage(allGalleryImages[currentIndex + 1]);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const thumbnailWidth = 100;
    const gapWidth = 8;
    const itemWidthWithGap = thumbnailWidth + gapWidth;
    const totalTrackWidth = allGalleryImages.length * thumbnailWidth + (allGalleryImages.length - 1) * gapWidth;
    const maxScroll = Math.max(0, totalTrackWidth - containerWidth);
    const targetOffset = currentIndex * itemWidthWithGap - containerWidth / 2 + thumbnailWidth / 2;
    setTrackOffset(Math.min(maxScroll, Math.max(0, targetOffset)));
  }, [currentIndex, allGalleryImages]);

  const handleAttrSelect = useCallback((name: string, val: string) => {
    setSelectedAttrs(prev => {
      const draftAttrs = { ...prev, [name]: val };
      const changeLevelIndex = groupedAttributes.findIndex(g => g.name === name);

      for (let i = changeLevelIndex + 1; i < groupedAttributes.length; i++) {
        const nextTargetGroup = groupedAttributes[i];
        const isStillFunctioning = variations.some(v => {
          const validatesUpToCurrentLayer = groupedAttributes.slice(0, i + 1).every(groupLayer =>
            v.attributes?.some(a => a.name === groupLayer.name && a.value === draftAttrs[groupLayer.name])
          );
          return validatesUpToCurrentLayer && checkStockGlobally(v);
        });
        if (!isStillFunctioning) {
          const viableEscapeVal = nextTargetGroup.values.find(candVal =>
            variations.some(v => {
              const pastLayers = groupedAttributes.slice(0, i).every(upLevelG =>
                v.attributes?.some(a => a.name === upLevelG.name && a.value === draftAttrs[upLevelG.name])
              );
              const isMatchingEscape = v.attributes?.some(a => a.name === nextTargetGroup.name && a.value === candVal.value);
              return pastLayers && isMatchingEscape && checkStockGlobally(v);
            })
          );
          draftAttrs[nextTargetGroup.name] = viableEscapeVal ? viableEscapeVal.value : nextTargetGroup.values[0].value;
        }
      }
      if (changeLevelIndex === 0) setSelectedGalleryImage(null);
      return draftAttrs;
    });
  }, [groupedAttributes, variations]);

  useEffect(() => {
    if (!activeRegion) return;

    // پیدا کردن اتمسفر ویژگی مربوط به ریجن
    const regionGroup = groupedAttributes.find(g => {
      const cleanName = g.name.replace('pa_', '').replace('attribute_', '').toLowerCase();
      return cleanName.includes('region') || cleanName.includes('ریجن');
    });

    if (regionGroup) {
      // مطابقت دادن مقدار ریجن هدر (مثل eu یا us) با مقادیر ویژگی محصول (مثل اروپا یا آمریکا)
      const matchedValue = regionGroup.values.find(v => {
        const valLower = v.value.toLowerCase();
        const regionLower = activeRegion.toLowerCase();
        return valLower === regionLower || 
               (regionLower === 'eu' && (valLower.includes('eu') || valLower.includes('اروپا'))) ||
               (regionLower === 'us' && (valLower.includes('us') || valLower.includes('آمریکا')));
      });

      if (matchedValue && selectedAttrs[regionGroup.name] !== matchedValue.value) {
        handleAttrSelect(regionGroup.name, matchedValue.value);
      }
    }
  }, [activeRegion, groupedAttributes, handleAttrSelect, selectedAttrs]);

  return (
    <div className="flex flex-col gap-12 w-full min-h-screen" dir="rtl">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full">

        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {categoryImage && (
                <div className="relative w-8 h-8 overflow-hidden">
                  <Image src={categoryImage} alt={categoryName} fill className="object-cover" />
                </div>
              )}
            </div>
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
          />

          <DeliveryAndPrice selectedVariation={combinedAggregateVar ?? null} />
        </div>

        <div className="lg:col-span-8 lg:sticky lg:top-6 h-fit flex flex-col gap-6 w-full">
          <div className="relative w-full aspect-[16/9] bg-brand-surface overflow-hidden border border-brand-surface_hover transition-all duration-300 shadow-lg group">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              priority
              loading="eager"
              quality={90}
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />

            {allGalleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handleNextImage}
                  disabled={currentIndex === allGalleryImages.length - 1}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-brand-bg text-brand-m_khonsa p-2 border border-brand-surface transition-all opacity-0 group-hover:opacity-100 hover:text-brand-white hover:border-brand-surface_m disabled:bg-opacity-50 border-opacity-10 disabled:pointer-events-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  disabled={currentIndex === 0}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-brand-bg text-brand-m_khonsa p-2 border border-brand-surface transition-all opacity-0 group-hover:opacity-100 hover:text-brand-white hover:border-brand-surface_m disabled:bg-opacity-50 border-opacity-10 disabled:pointer-events-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 13 12 9 6" /></svg>
                </button>
              </>
            )}
          </div>

          {allGalleryImages.length > 1 && (
            <div ref={containerRef} className="relative w-full overflow-hidden py-1" dir="rtl">
              <div
                className="flex transition-transform duration-300 ease-in-out will-change-transform"
                style={{ gap: '8px', transform: `translateX(${trackOffset}px)` }}
              >
                {allGalleryImages.map((imgUrl, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedGalleryImage(imgUrl)}
                      className={`relative w-[100px] aspect-video flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                        isActive
                          ? 'border-brand-blue opacity-100 ring-2 ring-brand-blue/60 z-10 shadow-[0_0_12px_rgba(0,116,224,0.3)]'
                          : 'border-brand-surface_hover opacity-40 hover:opacity-80'
                      }`}
                    >
                      <Image src={imgUrl} alt={`گالری ${idx + 1}`} fill quality={75} className="object-cover" />
                    </button>
                  );
                })}
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

      {product.secondaryGallery && product.secondaryGallery.length > 0 && (
        <div className="w-full border-t border-brand-surface_hover pt-8 flex flex-col gap-6">
          <h2 className="text-xl font-black text-brand-active border-r-4 border-brand-blue pr-3">آیتم‌های محصول</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.secondaryGallery.map((item, index) => (
              <div key={index} className="bg-brand-menu border border-brand-surface_hover flex flex-col overflow-hidden shadow-md">
                {item.imageUrl && (
                  <div className="relative w-full aspect-[16/9] bg-brand-surface">
                    <Image src={item.imageUrl} alt="" fill quality={85} className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                  </div>
                )}
                {item.description && (
                  <p className="text-brand-surface_m text-xs leading-7 p-4">{item.description}</p>
                )}
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

      <ProductReviews />
    </div>
  );
}