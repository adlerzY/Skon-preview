"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VariationCard } from "@/lib/graphql";
import DeliveryAndPrice from "@/components/product/DeliveryAndPrice";
import VariationSelector from "@/components/product/VariationSelector";
import ProductStickyBar, { type DeliveryOption } from "@/components/product/ProductStickyBar";
import PurchaseStepper, { type PurchaseStep } from "@/components/product/PurchaseStepper";
import PurchaseSummary, { type PurchaseSummaryRow } from "@/components/product/PurchaseSummary";
import {
  DELIVERY_LABELS,
  hasAnyDelivery,
  useProductDelivery,
  type DeliveryType,
} from "@/components/product/useProductDelivery";
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

  const deliveryAvailable = hasAnyDelivery(selectedVariation);
  const hasSelectableOptions = groupedAttributes.length > 0;

  const [step, setStep] = useState<PurchaseStep>(() => (deliveryAvailable ? 2 : 1));

  const maxStep: PurchaseStep = !selectedVariation ? 1 : purchase.deliveryType ? 3 : 2;
  const activeStep: PurchaseStep = step > maxStep ? maxStep : step;

  useEffect(() => {
    if (step > maxStep) setStep(maxStep);
  }, [step, maxStep]);

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

  const variationText = useMemo(
    () =>
      groupedAttributes
        .map((group) => selectedAttrs[group.name])
        .filter(Boolean)
        .join(" - "),
    [groupedAttributes, selectedAttrs]
  );

  const deliveryLabel = purchase.deliveryType ? DELIVERY_LABELS[purchase.deliveryType] : null;

  const stickyDeliveryOptions: DeliveryOption[] = [
    { value: "direct", label: "مستقیم", disabled: purchase.isDirectDisabled },
    { value: "gift", label: "گیفت", disabled: purchase.isGiftDisabled },
    { value: "code", label: "کد اصلی", disabled: purchase.isCodeDisabled },
  ];

  const stickyCtaLabel = purchase.isAddingToCart
    ? "در حال پردازش..."
    : purchase.isCartFull
    ? "سبد پر است"
    : !purchase.deliveryType
    ? "انتخاب روش تحویل"
    : purchase.isFormValid()
    ? "افزودن به سبد خرید"
    : "تکمیل اطلاعات";

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

    setStep(purchase.deliveryType ? 3 : 2);
    document.getElementById(PRODUCT_HERO_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(
      purchase.deliveryType ? "لطفاً اطلاعات لازم را تکمیل کنید" : "ابتدا روش تحویل را انتخاب کنید",
      "error"
    );
  };

  const primaryLabel =
    activeStep === 1
      ? "ادامه: انتخاب روش تحویل"
      : activeStep === 2
      ? "ادامه: تکمیل اطلاعات"
      : purchase.isAddingToCart
      ? "در حال پردازش..."
      : purchase.isCartFull
      ? "سبد خرید پر است (حداکثر ۱۰ عدد)"
      : "افزودن به سبد خرید";

  const primaryDisabled =
    activeStep === 1
      ? !deliveryAvailable
      : activeStep === 2
      ? !purchase.deliveryType
      : !purchase.isFormValid() || purchase.isAddingToCart || purchase.isCartFull;

  const handlePrimary = () => {
    if (activeStep === 1) {
      if (deliveryAvailable) setStep(2);
      return;
    }
    if (activeStep === 2) {
      if (purchase.deliveryType) setStep(3);
      return;
    }
    purchase.handleAddToCart();
  };

  const handleBack =
    activeStep === 3
      ? () => setStep(2)
      : activeStep === 2 && hasSelectableOptions
      ? () => setStep(1)
      : undefined;

  const summaryRows: PurchaseSummaryRow[] = [
    { label: "محصول", value: productName },
    ...(regionInfo ? [{ label: "ریجن", value: regionInfo.value }] : []),
    ...(variationText
      ? [
          {
            label: "نسخه",
            value: variationText,
            onEdit: hasSelectableOptions && activeStep !== 1 ? () => setStep(1) : undefined,
          },
        ]
      : []),
    {
      label: "روش تحویل",
      value: deliveryLabel ?? "انتخاب نشده",
      muted: !deliveryLabel,
      onEdit: deliveryAvailable && activeStep !== 2 ? () => setStep(2) : undefined,
    },
  ];

  const compactText =
    [variationText, regionInfo?.value, deliveryLabel].filter(Boolean).join(" · ") || productName;

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

      <div className="flex w-full flex-col gap-4">
        <PurchaseStepper
          active={activeStep}
          completed={[
            Boolean(selectedVariation) && deliveryAvailable,
            Boolean(purchase.deliveryType),
            false,
          ]}
          selectable={[hasSelectableOptions, deliveryAvailable, Boolean(purchase.deliveryType)]}
          onSelect={setStep}
        />

        <div key={activeStep} className="animate-in fade-in duration-200 motion-reduce:animate-none">
          {activeStep === 1 && (
            <div className="flex flex-col gap-4">
              <VariationSelector
                groupedAttributes={groupedAttributes}
                selectedAttrs={selectedAttrs}
                onAttributeSelect={handleAttrSelect}
                variations={variations}
                regionInfo={regionInfo}
                deliveryType={purchase.deliveryType}
              />
              {!selectedVariation && (
                <div className="border border-brand-surface_hover bg-brand-surface py-4 text-center text-sm text-brand-surface_m">
                  محصول در حال حاضر موجود نمی‌باشد.
                </div>
              )}
            </div>
          )}
          {activeStep === 2 && selectedVariation && (
            <DeliveryAndPrice step={2} selectedVariation={selectedVariation} purchase={purchase} />
          )}
          {activeStep === 3 && selectedVariation && (
            <DeliveryAndPrice step={3} selectedVariation={selectedVariation} purchase={purchase} />
          )}
        </div>

        <PurchaseSummary
          rows={summaryRows}
          compactText={compactText}
          showPrice={Boolean(purchase.deliveryType)}
          price={purchase.currentPrice}
          regularPrice={purchase.regularPrice}
          primaryLabel={primaryLabel}
          primaryDisabled={primaryDisabled}
          onPrimary={handlePrimary}
          onBack={handleBack}
          burstKey={purchase.burstKey}
        />
      </div>
    </>
  );
}