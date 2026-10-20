"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VariationCard } from "@/lib/graphql";
import DeliveryAndPrice from "@/components/product/DeliveryAndPrice";
import VariationSelector from "@/components/product/VariationSelector";
import ProductStickyBar, { type DeliveryOption } from "@/components/product/ProductStickyBar";
import { useProductDelivery, type DeliveryType } from "@/components/product/useProductDelivery";
import { useToast } from "@/context/ToastContext";
import { useProductMediaActions } from "./ProductMediaContext";
import { PRODUCT_HERO_ID } from "./productConstants";
import {
  aggregateVariation,
  resolveNextSelection,
  type SimpleProductFallback,
} from "./variationAggregate";
import {
  buildGroupedAttributes,
  findFirstValidAttributes,
  findRegionInfo,
} from "./variationMatcher";

interface PurchasePanelProps {
  productId: number;
  productName: string;
  productSlug: string;
  region: string;
  initialEdition?: string;
  variations: VariationCard[];
  fallbackPrice: number | null;
  fallbackRegularPrice: number | null;
  fallbackImage: string | null;
}

export default function PurchasePanel({
  productId,
  productName,
  productSlug,
  region,
  initialEdition,
  variations,
  fallbackPrice,
  fallbackRegularPrice,
  fallbackImage,
}: PurchasePanelProps) {
  const media = useProductMediaActions();
  const { showToast } = useToast();
  const [showStickyBar, setShowStickyBar] = useState(false);

  const groupedAttributes = useMemo(() => buildGroupedAttributes(variations), [variations]);
  const regionInfo = useMemo(() => findRegionInfo(variations, region), [variations, region]);

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() =>
    findFirstValidAttributes(variations, groupedAttributes, regionInfo, initialEdition)
  );

  const fallback = useMemo<SimpleProductFallback>(
    () => ({
      databaseId: productId,
      name: productName,
      slug: productSlug,
      price: fallbackPrice,
      regularPrice: fallbackRegularPrice,
      imageUrl: fallbackImage,
    }),
    [productId, productName, productSlug, fallbackPrice, fallbackRegularPrice, fallbackImage]
  );

  const selectedVariation = useMemo(
    () => aggregateVariation(variations, groupedAttributes, selectedAttrs, regionInfo, fallback),
    [variations, groupedAttributes, selectedAttrs, regionInfo, fallback]
  );

  const purchase = useProductDelivery({
    selectedVariation,
    productId,
    productName,
    selectedAttrs,
    groupedAttributes,
    regionInfo,
  });

  useEffect(() => {
    const urls = variations
      .map((variation) => variation.imageUrl?.trim())
      .filter((url): url is string => Boolean(url));
    media.registerVariationImages(urls);
  }, [variations, media]);

  useEffect(() => {
    const hero = document.getElementById(PRODUCT_HERO_ID);
    if (!hero || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const handleAttrSelect = useCallback(
    (name: string, value: string) => {
      const { attrs, changedIndex } = resolveNextSelection(
        variations,
        groupedAttributes,
        regionInfo,
        selectedAttrs,
        name,
        value
      );
      setSelectedAttrs(attrs);

      const next = aggregateVariation(variations, groupedAttributes, attrs, regionInfo, fallback);
      media.showVariationImage(next?.imageUrl?.trim() || null, changedIndex === 0);
    },
    [variations, groupedAttributes, regionInfo, selectedAttrs, fallback, media]
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

  const codeStock = selectedVariation?.codeStockCount;
  const inventoryHint =
    purchase.deliveryType === "code" &&
    typeof codeStock === "number" &&
    codeStock > 0 &&
    codeStock <= 5
      ? `فقط ${codeStock.toLocaleString("fa-IR")} عدد باقی مانده`
      : null;

  const handleStickyCta = () => {
    if (purchase.isCartFull) return;

    if (purchase.isFormValid()) {
      purchase.handleAddToCart();
      return;
    }

    document.getElementById(PRODUCT_HERO_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("لطفاً اطلاعات لازم را تکمیل کنید", "error");
  };

  return (
    <>
      <ProductStickyBar
        visible={showStickyBar}
        productName={productName}
        groupedAttributes={groupedAttributes}
        selectedAttrs={selectedAttrs}
        onAttributeSelect={handleAttrSelect}
        deliveryOptions={stickyDeliveryOptions}
        selectedDelivery={purchase.deliveryType ?? ""}
        onDeliverySelect={(value) => purchase.setDeliveryType(value as DeliveryType)}
        price={purchase.currentPrice}
        regularPrice={purchase.regularPrice}
        inventoryHint={inventoryHint}
        ctaLabel={stickyCtaLabel}
        ctaDisabled={purchase.isAddingToCart || purchase.isCartFull}
        onCtaClick={handleStickyCta}
      />

      <VariationSelector
        groupedAttributes={groupedAttributes}
        selectedAttrs={selectedAttrs}
        onAttributeSelect={handleAttrSelect}
        variations={variations}
        regionInfo={regionInfo}
        deliveryType={purchase.deliveryType}
      />

      <DeliveryAndPrice selectedVariation={selectedVariation} purchase={purchase} />
    </>
  );
}