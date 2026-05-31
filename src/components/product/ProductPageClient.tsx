"use client";

import React, { useState, useMemo, useEffect } from "react";
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
    (v.parsedPrice != null) ||
    (v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled") ||
    (v.parsedCodePrice != null && v.parsedCodePrice !== "disabled")
  );
};

export default function ProductPageClient({ product, initialEdition }: Props) {
  const variations = product.variationCards || [];
  
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
      const isDeliveryAttr = nameLower.includes('delivery') || nameLower.includes('تحویل') || nameLower.includes('روش') || nameLower.includes('method');
      const isDeliveryVal = Array.from(values).some(val => 
        val.includes('گیفت') || val.includes('مستقیم') || val.includes('کد') || 
        val.toLowerCase().includes('gift') || val.toLowerCase().includes('direct')
      );

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

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    return findFirstValidAttributes();
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
    return matched ? matched.imageUrl : null;
  }, [variations, groupedAttributes, selectedAttrs]);

  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const displayImage = selectedGalleryImage || firstBranchVarImageUrl || product.image?.sourceUrl || "/placeholder.jpg";
  
  const category = product.productCategories?.nodes?.[0];
  const categoryName = category?.name || "بدون دسته";
  const categoryImage = category?.image?.sourceUrl;

  const handlePrevImage = () => {
    const currentIndex = allGalleryImages.indexOf(displayImage);
    if (currentIndex === -1) return;
    const prevIndex = currentIndex === 0 ? allGalleryImages.length - 1 : currentIndex - 1;
    setSelectedGalleryImage(allGalleryImages[prevIndex]);
  };

  const handleNextImage = () => {
    const currentIndex = allGalleryImages.indexOf(displayImage);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex === allGalleryImages.length - 1 ? 0 : currentIndex + 1;
    setSelectedGalleryImage(allGalleryImages[nextIndex]);
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 min-h-screen">
      
      <div className="lg:col-span-4 lg:order-first flex flex-col gap-6 sticky top-6 h-fit">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {categoryImage && (
              <div className="relative w-6 h-6 overflow-hidden bg-brand-surface_hover">
                <Image src={categoryImage} alt={categoryName} fill className="object-cover" />
              </div>
            )}
            <span className="text-brand-blue text-xs font-bold uppercase tracking-wider">{categoryName}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-active leading-tight">{product.name}</h1>
          <div className="mt-3 inline-block bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs px-3 py-1.5 font-medium">
             ✨ تحویل فوری و تضمین شده
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

      <div className="lg:col-span-8 lg:order-last flex flex-col gap-6">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-brand-bg hover:border-brand-surface_m text-m_khonsa hover:text-brand-white p-2 transition-all opacity-0 group-hover:opacity-100 border border-brand-surface"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-brand-bg hover:border-brand-surface_m text-m_khonsa hover:text-brand-white p-2 transition-all opacity-0 group-hover:opacity-100 border border-brand-surface"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 13 12 9 6"/></svg>
              </button>
            </>
          )}
        </div>

        {allGalleryImages.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {allGalleryImages.map((imgUrl, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedGalleryImage(imgUrl)}
                className={`relative aspect-video overflow-hidden border-2 transition-all duration-200 ${
                  (selectedGalleryImage === imgUrl) || (!selectedGalleryImage && imgUrl === displayImage) 
                    ? 'border-brand-blue opacity-100 scale-105' 
                    : 'border-transparent opacity-60 hover:opacity-100 hover:border-brand-surface_hover'
                }`}
              >
                <Image src={imgUrl} alt={`گالری ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {product.description && (
          <div className="bg-brand-menu p-6">
            <h3 className="text-lg font-bold text-brand-active mb-4">توضیحات محصول</h3>
            <div 
              className="text-brand-surface_m text-sm leading-7 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </div>
        )}
      </div>

    </div>
  );
}