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
      const isDeliveryByName = nameLower.includes('delivery') || nameLower.includes('تحویل') || nameLower.includes('روش') || nameLower.includes('method');
      const isDeliveryByValue = Array.from(values).some(val => 
        val.includes('گیفت') || val.includes('مستقیم') || val.includes('کد') || 
        val.toLowerCase().includes('gift') || val.toLowerCase().includes('direct')
      );

      if (!isDeliveryByName && !isDeliveryByValue) {
        filteredMap.set(name, values);
      }
    });

    return Array.from(filteredMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values)
    }));
  }, [variations]);

  const isVariationInStock = (v: VariationCard) => {
    return (
      (v.parsedPrice !== null && v.parsedPrice !== undefined) ||
      (v.parsedGiftPrice !== "disabled" && v.parsedGiftPrice != null) ||
      (v.parsedCodePrice !== "disabled" && v.parsedCodePrice != null)
    );
  };

  const isCombinationValid = (testAttrs: Record<string, string>, upToGroupIndex: number) => {
    return variations.some(v => {
      if (!isVariationInStock(v)) return false;
      
      for (let j = 0; j <= upToGroupIndex; j++) {
        const group = groupedAttributes[j];
        const expectedValue = testAttrs[group.name];
        const hasAttr = v.attributes?.some(a => a.name === group.name && a.value === expectedValue);
        if (!hasAttr) return false;
      }
      return true;
    });
  };

  // اصلاح اساسی: انتخاب هوشمند و شاخه به شاخه متغیرها بر اساس موجودی
  const findFirstValidAttributes = (targetEdition?: string) => {
    const attrs: Record<string, string> = {};
    if (variations.length === 0 || groupedAttributes.length === 0) return attrs;

    groupedAttributes.forEach((group, index) => {
      // ۱. اگر لود اولیه با ادیشن خاصی بود و توی این شاخه معتبر بود
      if (targetEdition && group.values.includes(targetEdition)) {
        const tempAttrs = { ...attrs, [group.name]: targetEdition };
        if (isCombinationValid(tempAttrs, index)) {
          attrs[group.name] = targetEdition;
          return;
        }
      }

      // ۲. پیدا کردن اولین متغیری که با انتخاب‌های شاخه‌های قبلی، ترکیب موجود و معتبری می‌سازه
      const firstValidValue = group.values.find(val => {
        const tempAttrs = { ...attrs, [group.name]: val };
        return isCombinationValid(tempAttrs, index);
      });

      if (firstValidValue) {
        attrs[group.name] = firstValidValue;
      } else {
        // ۳. فال‌بک نهایی اگر کلاً محصول ناموجود بود
        attrs[group.name] = group.values[0];
      }
    });

    return attrs;
  };

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    return findFirstValidAttributes();
  });

  useEffect(() => {
    if (initialEdition) {
      setSelectedAttrs(findFirstValidAttributes(initialEdition));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEdition]);

  const selectedVar = useMemo(() => {
    if (variations.length === 0) return null;
    const exactMatch = variations.find(v => {
      return groupedAttributes.every(group => {
        const attrInVar = v.attributes?.find(a => a.name === group.name);
        return attrInVar ? attrInVar.value === selectedAttrs[group.name] : true;
      });
    });
    return exactMatch || variations.find(v => isVariationInStock(v)) || variations[0] || null;
  }, [variations, selectedAttrs, groupedAttributes]);

  const allGalleryImages = useMemo(() => {
    const images = new Set<string>();
    if (product.image?.sourceUrl) images.add(product.image.sourceUrl);
    variations.forEach(v => { if (v.imageUrl) images.add(v.imageUrl); });
    product.galleryImages?.nodes?.forEach((g: any) => { if (g.sourceUrl) images.add(g.sourceUrl); });
    return Array.from(images);
  }, [product, variations]);

  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const displayImage = selectedGalleryImage || selectedVar?.imageUrl || product.image?.sourceUrl || "/placeholder.jpg";
  
  const category = product.productCategories?.nodes?.[0];
  const categoryName = category?.name || "بدون دسته";
  const categoryImage = category?.image?.sourceUrl;

  // مدیریت آبشاری کلیک‌ها و پرش اتوماتیک از روی گزینه‌های ناموجود
  const handleAttrSelect = (name: string, val: string) => {
    setSelectedAttrs(prev => {
      const newAttrs = { ...prev, [name]: val };
      const clickedGroupIndex = groupedAttributes.findIndex(g => g.name === name);
      
      for (let i = clickedGroupIndex + 1; i < groupedAttributes.length; i++) {
        const nextGroup = groupedAttributes[i];
        const currentSelectedValue = newAttrs[nextGroup.name];
        
        const isCurrentValid = currentSelectedValue && isCombinationValid(newAttrs, i);
        
        if (!isCurrentValid) {
          const fallbackValue = nextGroup.values.find(vVal => {
            const tempAttrs = { ...newAttrs, [nextGroup.name]: vVal };
            return isCombinationValid(tempAttrs, i);
          });
          
          if (fallbackValue) {
            newAttrs[nextGroup.name] = fallbackValue;
          } else {
            // اگر هیچ ترکیبی معتبر نبود، اولین گزینه‌ای که حداقل یک‌جا موجودی دارد را انتخاب کن
            const anyValid = nextGroup.values.find(vVal => {
              return variations.some(v => isVariationInStock(v) && v.attributes?.some(a => a.name === nextGroup.name && a.value === vVal));
            });
            newAttrs[nextGroup.name] = anyValid || nextGroup.values[0];
          }
        }
      }
      return newAttrs;
    });
    setSelectedGalleryImage(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 min-h-screen rounded-2xl">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="relative w-full aspect-[16/9] bg-brand-surface rounded-xl overflow-hidden border border-brand-surface_hover transition-all duration-300 shadow-lg">
          <Image 
            src={displayImage} 
            alt={product.name} 
            fill
            className="object-cover transition-opacity duration-300"
            priority
          />
        </div>

        {allGalleryImages.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {allGalleryImages.map((imgUrl, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedGalleryImage(imgUrl)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 ${
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
          <div className="mt-4 bg-brand-surface border border-brand-surface_hover p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-brand-active mb-4">توضیحات محصول</h3>
            <div 
              className="text-brand-surface_m text-sm leading-8 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </div>
        )}
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6 h-fit">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {categoryImage && (
              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-brand-surface_hover">
                <Image src={categoryImage} alt={categoryName} fill className="object-cover" />
              </div>
            )}
            <span className="text-brand-blue text-xs font-bold uppercase tracking-wider">{categoryName}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-active leading-tight">{product.name}</h1>
          <div className="mt-3 inline-block bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs px-3 py-1.5 rounded-md font-medium">
             ✨ تحویل فوری و تضمین شده
          </div>
        </div>

        <VariationSelector 
          groupedAttributes={groupedAttributes}
          selectedAttrs={selectedAttrs}
          onAttributeSelect={handleAttrSelect}
          variations={variations}
        />

        <DeliveryAndPrice selectedVariation={selectedVar || variations[0]} />
      </div>
    </div>
  );
}