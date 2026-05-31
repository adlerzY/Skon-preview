"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { ProductNode, VariationCard } from "@/lib/wp-graphql";
import DeliveryAndPrice from "@/components/product/DeliveryAndPrice";
import VariationSelector from "@/components/product/VariationSelector";

interface Props {
  product: ProductNode;
  initialEdition?: string;
}

const checkStockGlobally = (v: VariationCard) => {
  return (
    v.parsedPrice != null ||
    (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
    (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled")
  );
};

export default function ProductPageClient({ product, initialEdition }: Props) {
  const variations = product.variationCards || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackOffset, setTrackOffset] = useState(0);

  // نرمال‌سازی متون برای جلوگیری از تداخل انکودینگ حروف فارسی/عربی بین سرور و کلاینت
  const groupedAttributes = useMemo(() => {
    const map = new Map<string, Set<string>>();
    variations.forEach(v => {
      v.attributes?.forEach(attr => {
        if (!map.has(attr.name)) map.set(attr.name, new Set());
        map.get(attr.name)!.add(attr.value);
      });
    });

    const filteredMap = new Map<string, Set<string>>();
    map.forEach((values, name) => {
      const nameLower = name.toLowerCase();
      const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
      
      const normalizedName = normalize(nameLower);
      const isDeliveryAttr = normalizedName.includes('delivery') || 
                             normalizedName.includes('تحویل') || 
                             normalizedName.includes('روش') || 
                             normalizedName.includes('method');
      
      const isDeliveryVal = Array.from(values).some(val => {
        const normalizedVal = normalize(val);
        return normalizedVal.includes('گیفت') || 
               normalizedVal.includes('مستقیم') || 
               normalizedVal.includes('کد') || 
               normalizedVal.includes('gift') || 
               normalizedVal.includes('direct');
      });

      if (!isDeliveryAttr && !isDeliveryVal) {
        filteredMap.set(name, values);
      }
    });

    return Array.from(filteredMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values)
    }));
  }, [variations]);

  const findFirstValidAttributes = (targetEdition?: string) => {
    const resultAttrs: Record<string, string> = {};
    if (variations.length === 0 || groupedAttributes.length === 0) return resultAttrs;

    for (let i = 0; i < groupedAttributes.length; i++) {
      const group = groupedAttributes[i];

      if (i === 0 && targetEdition && group.values.includes(targetEdition)) {
        resultAttrs[group.name] = targetEdition;
        continue;
      }

      const validOpt = group.values.find(candidateValue => {
        return variations.some(v => {
          const matchesPreceding = groupedAttributes.slice(0, i).every(prevG => 
             v.attributes?.some(a => a.name === prevG.name && a.value === resultAttrs[prevG.name])
          );
          const matchesCandidate = v.attributes?.some(a => a.name === group.name && a.value === candidateValue);
          return matchesPreceding && matchesCandidate && checkStockGlobally(v);
        });
      });

      resultAttrs[group.name] = validOpt || group.values[0]; 
    }
    return resultAttrs;
  };

  // مقداردهی اولیه وضعیت مستقیماً با initialEdition جهت هماهنگی کامل SSR و کلاینت
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    return findFirstValidAttributes(initialEdition);
  });

  useEffect(() => {
    if (initialEdition) {
      setSelectedAttrs(findFirstValidAttributes(initialEdition));
    }
  }, [initialEdition, groupedAttributes]);

  const combinedAggregateVar = useMemo(() => {
    if (variations.length === 0) return null;

    const matchingVars = variations.filter(v => {
      return groupedAttributes.every(group => {
        const currentAttrObj = v.attributes?.find(a => a.name === group.name);
        return currentAttrObj ? currentAttrObj.value === selectedAttrs[group.name] : true;
      });
    });

    if (matchingVars.length === 0) return variations.find(v => checkStockGlobally(v)) || variations[0];

    let accPrice: number | null = null;
    let accGift: number | 'disabled' = 'disabled';
    let accCode: number | 'disabled' = 'disabled';

    matchingVars.forEach(mv => {
      if (mv.parsedPrice != null && (accPrice === null || mv.parsedPrice < accPrice)) {
          accPrice = mv.parsedPrice;
      }
      if (mv.parsedGiftPrice != null && mv.parsedGiftPrice !== 'disabled') {
          accGift = (accGift === 'disabled' ? mv.parsedGiftPrice : Math.min(accGift as number, mv.parsedGiftPrice as number)) as number | 'disabled';
      }
      if (mv.parsedCodePrice != null && mv.parsedCodePrice !== 'disabled') {
          accCode = (accCode === 'disabled' ? mv.parsedCodePrice : Math.min(accCode as number, mv.parsedCodePrice as number)) as number | 'disabled';
      }

      const comboAttributesText = mv.attributes?.map(a => a.value.toLowerCase()).join(' ') || "";
      if (comboAttributesText.includes('گیفت') || comboAttributesText.includes('gift')) {
          if (mv.parsedPrice != null && accGift === 'disabled') accGift = mv.parsedPrice;
      }
      if (comboAttributesText.includes('کد') || comboAttributesText.includes('code')) {
          if (mv.parsedPrice != null && accCode === 'disabled') accCode = mv.parsedPrice;
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
    
    if (product.image?.sourceUrl?.trim()) {
      images.add(product.image.sourceUrl.trim());
    }
    
    variations.forEach(v => {
      if (v.imageUrl?.trim()) {
        images.add(v.imageUrl.trim());
      }
    });
    
    product.galleryImages?.nodes?.forEach((g: any) => {
      if (g.sourceUrl?.trim()) {
        images.add(g.sourceUrl.trim());
      }
    });
    
    return Array.from(images);
  }, [product, variations]);

  const firstBranchVarImageUrl = useMemo(() => {
    if (variations.length === 0 || groupedAttributes.length === 0) return null;
    const firstGroup = groupedAttributes[0];
    const selectedValForFirstGroup = selectedAttrs[firstGroup.name];
    
    const matched = variations.find(v => 
      v.attributes?.some(a => a.name === firstGroup.name && a.value === selectedValForFirstGroup) && v.imageUrl
    );
    return matched && matched.imageUrl ? matched.imageUrl.trim() : null;
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
    if (currentIndex > 0) {
      setSelectedGalleryImage(allGalleryImages[currentIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentIndex < allGalleryImages.length - 1) {
      setSelectedGalleryImage(allGalleryImages[currentIndex + 1]);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const thumbnailWidth = 100; 
    const gapWidth = 8; 
    const itemWidthWithGap = thumbnailWidth + gapWidth;
    
    const totalTrackWidth = allGalleryImages.length * thumbnailWidth + (allGalleryImages.length - 1) * gapWidth;
    const maxScroll = Math.max(0, totalTrackWidth - containerWidth);
    
    const targetOffset = (currentIndex * itemWidthWithGap) - (containerWidth / 2) + (thumbnailWidth / 2);
    
    setTrackOffset(Math.min(maxScroll, Math.max(0, targetOffset)));
  }, [currentIndex, allGalleryImages]);

  const handleAttrSelect = (name: string, val: string) => {
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
          const viableEscapeVal = nextTargetGroup.values.find(candVal => {
             return variations.some(v => {
                const pastLayers = groupedAttributes.slice(0, i).every(upLevelG => 
                  v.attributes?.some(a => a.name === upLevelG.name && a.value === draftAttrs[upLevelG.name])
                );
                const isMatchingEscape = v.attributes?.some(a => a.name === nextTargetGroup.name && a.value === candVal);
                return pastLayers && isMatchingEscape && checkStockGlobally(v);
             });
          });
          draftAttrs[nextTargetGroup.name] = viableEscapeVal || nextTargetGroup.values[0];
        }
      }

      if (changeLevelIndex === 0) {
        setSelectedGalleryImage(null);
      }

      return draftAttrs;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 min-h-screen" dir="rtl">
      
      <div className="lg:col-span-4 lg:order-first flex flex-col gap-6 sticky top-10 h-fit">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {categoryImage && (
              <div className="relative w-8 h-8 overflow-hidden">
                <Image src={categoryImage} alt={categoryName} fill className="object-cover" />
              </div>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-active leading-tight">{product.name}</h1>
          <div className="mt-3 inline-block bg-brand-zard text-brand-menu text-xs px-2 py-2.5 font-medium">
             نوتیف کوتاه
          </div>
        </div>

        <VariationSelector 
          groupedAttributes={groupedAttributes}
          selectedAttrs={selectedAttrs}
          onAttributeSelect={handleAttrSelect}
          variations={variations}
        />

        <DeliveryAndPrice selectedVariation={combinedAggregateVar || variations[0]} />
      </div>

      <div className="lg:col-span-8 lg:order-last flex flex-col gap-3">
        <div className="relative w-full aspect-[16/9] bg-brand-surface overflow-hidden border border-brand-surface_hover transition-all duration-300 shadow-lg group">
          <Image 
            src={displayImage} 
            alt={product.name} 
            fill
            className="object-cover transition-opacity duration-300"
            priority
          />

          {allGalleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handleNextImage}
                disabled={currentIndex === allGalleryImages.length - 1}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-brand-bg text-brand-m_khonsa p-2 border border-brand-surface transition-all opacity-0 group-hover:opacity-100 hover:text-brand-white hover:border-brand-surface_m disabled:bg-opacity-50 border-opacity-10 disabled:pointer-events-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button
                type="button"
                onClick={handlePrevImage}
                disabled={currentIndex === 0}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-brand-bg text-brand-m_khonsa p-2 border border-brand-surface transition-all opacity-0 group-hover:opacity-100 hover:text-brand-white hover:border-brand-surface_m disabled:bg-opacity-50 border-opacity-10 disabled:pointer-events-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 13 12 9 6"/></svg>
              </button>
            </>
          )}
        </div>

        {allGalleryImages.length > 1 && (
          <div ref={containerRef} className="relative w-full overflow-hidden py-1" dir="rtl">
            <div 
              className="flex transition-transform duration-300 ease-in-out will-change-transform"
              style={{ 
                gap: `8px`,
                transform: `translateX(${trackOffset}px)` 
              }}
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
                    <Image src={imgUrl} alt={`گالری ${idx + 1}`} fill className="object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.description && (
          <div className="bg-brand-menu p-6 ">
            <h3 className="text-lg font-bold text-brand-active mb-4">توضیحات محصول</h3>
            <div 
              className="text-brand-surface_m text-sm leading-8 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </div>
        )}
      </div>

    </div>
  );
}