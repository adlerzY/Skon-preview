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
import ProductStickyBar, { type DeliveryOption } from "@/components/product/ProductStickyBar";
import { useProductDelivery, type DeliveryType } from "@/components/product/useProductDelivery";
import { useToast } from "@/context/ToastContext";
import {
  buildGroupedAttributes,
  findFirstValidAttributes,
  findMatchingVariations,
  findRegionInfo,
  hasStock,
  matchesRegion,
} from "./variationMatcher";

interface Props {
  product: ProductNode;
  initialEdition?: string;
  activeRegion?: string;
  children?: React.ReactNode;
}

function stripSizeSuffix(url: string): string {
  return url.replace(/-\d+x\d+(?=\.[a-zA-Z0-9]+(?:[?#].*)?$)/, "");
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
      className={`absolute ${position} top-1/2 -translate-y-1/2 z-40 bg-brand-bg text-brand-m_khonsa p-2 border border-brand-surface transition-all opacity-0 group-hover:opacity-100 hover:text-brand-white hover:border-brand-surface_m disabled:!opacity-20 disabled:pointer-events-none`}
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
  children,
}: Props) {
  const variations = useMemo(() => product.variationCards ?? [], [product.variationCards]);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const heroRowRef = useRef<HTMLDivElement>(null);
  const hasScrolledThumbRef = useRef(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { showToast } = useToast();

  const effectiveRegion =
    !activeRegion || activeRegion === "$undefined" || activeRegion === "undefined"
      ? "eu-global"
      : activeRegion;

  const groupedAttributes = useMemo(() => buildGroupedAttributes(variations), [variations]);

  const regionInfo = useMemo(
    () => findRegionInfo(variations, effectiveRegion),
    [variations, effectiveRegion]
  );

  const getFirstValidAttributes = useCallback(
    (targetEdition?: string) =>
      findFirstValidAttributes(variations, groupedAttributes, regionInfo, targetEdition),
    [variations, groupedAttributes, regionInfo]
  );

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() =>
    getFirstValidAttributes(initialEdition)
  );
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [shouldPreloadImage, setShouldPreloadImage] = useState(true);

  useEffect(() => {
    setSelectedAttrs(getFirstValidAttributes(initialEdition));
    setSelectedGalleryImage(null);
    setShouldPreloadImage(true);
  }, [getFirstValidAttributes, initialEdition, product.databaseId]);

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
        giftPrice: "disabled",
        codePrice: "disabled",
        parsedPrice: product.parsedPrice,
        parsedRegularPrice: product.parsedRegularPrice ?? product.parsedPrice,
        parsedGiftPrice: "disabled",
        parsedGiftRegularPrice: "disabled",
        parsedCodePrice: "disabled",
        parsedCodeRegularPrice: "disabled",
      };
    }

    const candidates = findMatchingVariations(
      variations,
      groupedAttributes,
      selectedAttrs,
      regionInfo
    );

    if (candidates.length === 0) return null;

    let accPrice: number | null = null;
    let accRegularPrice: number | null = null;
    let accGift: number | "disabled" = "disabled";
    let accGiftRegular: number | "disabled" = "disabled";
    let accCode: number | "disabled" = "disabled";
    let accCodeRegular: number | "disabled" = "disabled";
    let accCodeStock: number | undefined = undefined;
    const variationIdsByDelivery: { direct?: number; gift?: number; code?: number } = {};

    for (const mv of candidates) {
      if (mv.parsedPrice != null && (accPrice === null || mv.parsedPrice < accPrice)) {
        accPrice = mv.parsedPrice;
        accRegularPrice = mv.parsedRegularPrice ?? mv.parsedPrice;
        variationIdsByDelivery.direct = mv.databaseId;
      }
      if (typeof mv.parsedGiftPrice === "number" && (accGift === "disabled" || mv.parsedGiftPrice < (accGift as number))) {
        accGift = mv.parsedGiftPrice;
        accGiftRegular = typeof mv.parsedGiftRegularPrice === "number" ? mv.parsedGiftRegularPrice : mv.parsedGiftPrice;
        variationIdsByDelivery.gift = mv.databaseId;
      }
      if (typeof mv.parsedCodePrice === "number") {
        const currentViable = typeof accCodeStock === "number" && accCodeStock > 0;
        const candidateViable = typeof mv.codeStockCount === "number" && mv.codeStockCount > 0;
        const shouldReplace =
          accCode === "disabled" ||
          (candidateViable && !currentViable) ||
          (candidateViable === currentViable && mv.parsedCodePrice < (accCode as number));
        if (shouldReplace) {
          accCode = mv.parsedCodePrice;
          accCodeRegular = typeof mv.parsedCodeRegularPrice === "number" ? mv.parsedCodeRegularPrice : mv.parsedCodePrice;
          accCodeStock = mv.codeStockCount;
          variationIdsByDelivery.code = mv.databaseId;
        }
      }

      const comboText = mv.attributes?.map((a) => a.value.toLowerCase()).join(" ") ?? "";
      if ((comboText.includes("گیفت") || comboText.includes("gift")) && mv.parsedPrice != null && accGift === "disabled") {
        accGift = mv.parsedPrice;
        accGiftRegular = mv.parsedRegularPrice ?? mv.parsedPrice;
        variationIdsByDelivery.gift = mv.databaseId;
      }
      if ((comboText.includes("کد") || comboText.includes("code")) && mv.parsedPrice != null) {
        const currentViable = typeof accCodeStock === "number" && accCodeStock > 0;
        const candidateViable = typeof mv.codeStockCount === "number" && mv.codeStockCount > 0;
        const shouldReplace =
          accCode === "disabled" ||
          (candidateViable && !currentViable) ||
          (candidateViable === currentViable && mv.parsedPrice < (accCode as number));
        if (shouldReplace) {
          accCode = mv.parsedPrice;
          accCodeRegular = mv.parsedRegularPrice ?? mv.parsedPrice;
          accCodeStock = mv.codeStockCount;
          variationIdsByDelivery.code = mv.databaseId;
        }
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
      codeStockCount: accCodeStock,
      variationIdsByDelivery,
    };
  }, [variations, selectedAttrs, groupedAttributes, regionInfo, product]);

  const purchase = useProductDelivery({
    selectedVariation: combinedAggregateVar,
    productId: product.databaseId,
    productName: product.name,
    selectedAttrs,
    groupedAttributes,
    regionInfo,
  });

  const selectedVariationImageUrl = useMemo(
    () => combinedAggregateVar?.imageUrl?.trim() || null,
    [combinedAggregateVar]
  );

  const allGalleryImages = useMemo(() => {
    const MAX_GALLERY_IMAGES = 12;
    const seen = new Set<string>();
    const images: string[] = [];

    const add = (url: string | undefined | null) => {
      if (images.length >= MAX_GALLERY_IMAGES) return;
      const trimmed = url?.trim();
      if (!trimmed) return;
      const dedupeKey = stripSizeSuffix(trimmed);
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      images.push(trimmed);
    };

    add(product.imageLarge?.sourceUrl || product.image?.sourceUrl);
    for (const g of product.galleryImages?.nodes ?? []) add(g.sourceUrl);
    add(selectedVariationImageUrl);
    for (const v of variations) add(v.imageUrl);

    return images;
  }, [product, variations, selectedVariationImageUrl]);

  const displayImage =
    selectedGalleryImage ||
    selectedVariationImageUrl ||
    product.imageLarge?.sourceUrl?.trim() ||
    product.image?.sourceUrl?.trim() ||
    "/placeholder.jpg";

  const currentIndex = useMemo(() => {
    const idx = allGalleryImages.indexOf(displayImage);
    return idx !== -1 ? idx : 0;
  }, [allGalleryImages, displayImage]);

  useEffect(() => {
    if (!hasScrolledThumbRef.current) {
      hasScrolledThumbRef.current = true;
      return;
    }
    activeThumbRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  useEffect(() => {
    const el = heroRowRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleAttrSelect = useCallback(
    (name: string, val: string) => {
      setSelectedAttrs((prev) => {
        const draft = { ...prev, [name]: val };
        if (regionInfo) draft[regionInfo.name] = regionInfo.value;

        const changeIdx = groupedAttributes.findIndex((g) => g.name === name);

        for (let i = changeIdx + 1; i < groupedAttributes.length; i++) {
          const nextGroup = groupedAttributes[i];
          const stillValid = variations.some((v) => {
            const matchesUpToHere = groupedAttributes
              .slice(0, i + 1)
              .every((g) => v.attributes?.some((a) => a.name === g.name && a.value === draft[g.name]));
            return matchesUpToHere && matchesRegion(v, regionInfo) && hasStock(v);
          });

          if (!stillValid) {
            const fallback = nextGroup.values.find((cand) =>
              variations.some((v) => {
                const pastLayers = groupedAttributes
                  .slice(0, i)
                  .every((g) => v.attributes?.some((a) => a.name === g.name && a.value === draft[g.name]));
                const matchesCand = v.attributes?.some((a) => a.name === nextGroup.name && a.value === cand.value);
                return pastLayers && matchesCand && matchesRegion(v, regionInfo) && hasStock(v);
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

  const stickyDeliveryOptions: DeliveryOption[] = [
    { value: "direct", label: "مستقیم", disabled: purchase.isDirectDisabled },
    { value: "gift", label: "گیفت", disabled: purchase.isGiftDisabled },
    { value: "code", label: "کد اصلی", disabled: purchase.isCodeDisabled },
  ];

  const stickyCtaLabel = purchase.isAddingToCart
    ? "در حال پردازش..."
    : purchase.isCartFull
    ? "سبد پر است"
    : "افزودن به سبد خرید";

  const handleStickyCta = useCallback(() => {
    if (purchase.isCartFull) return;

    if (purchase.isFormValid()) {
      purchase.handleAddToCart();
      return;
    }

    heroRowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("لطفاً اطلاعات لازم را تکمیل کنید", "error");
  }, [purchase, showToast]);

  return (
    <div className="flex flex-col gap-12 w-full" dir="rtl">
      <ProductStickyBar
        visible={showStickyBar}
        productName={product.name}
        groupedAttributes={groupedAttributes}
        selectedAttrs={selectedAttrs}
        onAttributeSelect={handleAttrSelect}
        deliveryOptions={stickyDeliveryOptions}
        selectedDelivery={purchase.deliveryType ?? ""}
        onDeliverySelect={(value) => purchase.setDeliveryType(value as DeliveryType)}
        price={purchase.currentPrice}
        regularPrice={purchase.regularPrice}
        inventoryHint={
          purchase.deliveryType === "code" && typeof combinedAggregateVar?.codeStockCount === "number" && combinedAggregateVar.codeStockCount > 0 && combinedAggregateVar.codeStockCount <= 5
            ? `فقط ${combinedAggregateVar.codeStockCount.toLocaleString("fa-IR")} عدد باقی مانده`
            : null
        }
        ctaLabel={stickyCtaLabel}
        ctaDisabled={purchase.isAddingToCart || purchase.isCartFull}
        onCtaClick={handleStickyCta}
      />

      <div ref={heroRowRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 w-full items-stretch">
        <div className="lg:col-span-4 w-full">
          <div className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-brand-active leading-tight">{product.name}</h1>
              </div>
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

            <DeliveryAndPrice selectedVariation={combinedAggregateVar} purchase={purchase} />
          </div>
        </div>

        <div className="lg:col-span-8 w-full">
          <div className="flex flex-col gap-6 lg:sticky lg:top-[96px]">
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 w-full">
              <div className="relative w-full sm:flex-1 aspect-[16/9] bg-brand-surface overflow-hidden border border-brand-surface_hover shadow-lg group">
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  preload={shouldPreloadImage}
                  quality={90}
                  className="object-cover transition-opacity duration-300"
                  onLoad={() => setShouldPreloadImage(false)}
                  onError={() => setShouldPreloadImage(false)}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 58vw"
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
                <div className="w-full sm:w-[96px] lg:w-[108px] shrink-0 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto scrollbar-hide py-1 sm:py-0">
                  <div className="flex sm:flex-col gap-2.5 w-max sm:w-full">
                    {allGalleryImages.map((imgUrl, idx) => (
                      <button
                        key={`${imgUrl}-${idx}`}
                        ref={idx === currentIndex ? activeThumbRef : undefined}
                        type="button"
                        onClick={() => setSelectedGalleryImage(imgUrl)}
                        className={`relative w-[86px] sm:w-full aspect-video flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                          idx === currentIndex
                            ? "border-brand-blue opacity-100 ring-2 ring-brand-blue/60 shadow-[0_0_12px_rgba(0,116,224,0.3)]"
                            : "border-brand-surface_hover opacity-40 hover:opacity-80"
                        }`}
                        aria-label={`تصویر ${idx + 1}`}
                      >
                        <Image
                          src={imgUrl}
                          alt={`گالری ${idx + 1}`}
                          fill
                          loading="lazy"
                          sizes="(max-width: 640px) 86px, 108px"
                          quality={60}
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
      </div>

      {children}
    </div>
  );
}