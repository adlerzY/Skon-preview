"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import type { VariationCard } from "@/lib/graphql";
import DeliveryAndPrice from "@/components/product/DeliveryAndPrice";
import VariationSelector from "@/components/product/VariationSelector";
import ProductStickyBar, { type DeliveryOption } from "@/components/product/ProductStickyBar";
import PurchaseStepper, { type StepperItem } from "@/components/product/PurchaseStepper";
import PurchaseSummary, { type PurchaseSummaryRow } from "@/components/product/PurchaseSummary";
import PurchaseActions from "@/components/product/PurchaseActions";
import StepViewport from "@/components/product/StepViewport";
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

type StepId = "options" | "delivery" | "details";

const STEP_LABELS: Record<StepId, string> = {
  options: "نسخه و مشخصات",
  delivery: "روش تحویل",
  details: "تکمیل و ثبت",
};

function UnavailableNotice() {
  return (
    <div className="border border-brand-surface_hover bg-brand-surface py-4 text-center text-sm text-brand-surface_m">
      محصول در حال حاضر موجود نمی‌باشد.
    </div>
  );
}

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
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const stepperRef = useRef<HTMLDivElement>(null);

  const groupedAttributes = useMemo(() => buildGroupedAttributes(variations), [variations]);
  const regionInfo = useMemo(() => findRegionInfo(variations, region), [variations, region]);
  const hasChoices = useMemo(
    () => groupedAttributes.some((group) => group.values.length > 1),
    [groupedAttributes]
  );

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

  const [step, setStep] = useState<StepId>(hasChoices ? "options" : "delivery");

  let activeStep: StepId = step;
  if (activeStep === "details" && !purchase.deliveryType) activeStep = "delivery";
  if (activeStep === "delivery" && !deliveryAvailable && hasChoices) activeStep = "options";
  if (activeStep === "options" && !hasChoices) activeStep = "delivery";

  useEffect(() => {
    if (activeStep !== step) setStep(activeStep);
  }, [activeStep, step]);

  const previousStepRef = useRef<StepId>(activeStep);

  useEffect(() => {
    if (previousStepRef.current === activeStep) return;
    previousStepRef.current = activeStep;

    const node = stepperRef.current;
    if (!node) return;

    const top = node.getBoundingClientRect().top;
    if (top >= 72 && top <= window.innerHeight * 0.6) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: Math.max(0, window.scrollY + top - 96),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeStep]);

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

  const stepIds: StepId[] = hasChoices ? ["options", "delivery", "details"] : ["delivery", "details"];

  const stepperItems: StepperItem[] = stepIds.map((id): StepperItem => {
    const done =
      id === "options"
        ? Boolean(selectedVariation) && deliveryAvailable
        : id === "delivery"
        ? Boolean(purchase.deliveryType)
        : false;

    const reachable =
      id === "options" ? hasChoices : id === "delivery" ? deliveryAvailable : Boolean(purchase.deliveryType);

    return {
      id,
      label: STEP_LABELS[id],
      status: id === activeStep ? "active" : done ? "done" : "upcoming",
      clickable: reachable && id !== activeStep,
    };
  });

  const variationText = groupedAttributes
    .map((group) => selectedAttrs[group.name])
    .filter(Boolean)
    .join(" - ");

  const deliveryLabel = purchase.deliveryType ? DELIVERY_LABELS[purchase.deliveryType] : "";

  const addedSignature = `${activeStep}|${selectedVariation?.databaseId ?? 0}|${purchase.deliveryType ?? ""}`;
  const justAdded = activeStep === "details" && addedKey === addedSignature;

  const submitAdd = () => {
    if (purchase.handleAddToCart()) setAddedKey(addedSignature);
  };

  const formValid = purchase.isFormValid();

  const primaryLabel =
    activeStep === "options"
      ? "ادامه: انتخاب روش تحویل"
      : activeStep === "delivery"
      ? "ادامه: تکمیل اطلاعات"
      : purchase.isAddingToCart
      ? "در حال پردازش..."
      : purchase.isCartFull
      ? "سبد خرید پر است (حداکثر ۱۰ عدد)"
      : "افزودن به سبد خرید";

  const primaryDisabled =
    activeStep === "options"
      ? !deliveryAvailable
      : activeStep === "delivery"
      ? !purchase.deliveryType
      : !formValid || purchase.isAddingToCart || purchase.isCartFull;

  const actionHint =
    activeStep === "details" && !formValid && !purchase.isCartFull
      ? purchase.deliveryType === "direct"
        ? "ایمیل و رمز عبور اکانت را کامل وارد کنید"
        : purchase.deliveryType === "gift"
        ? "BattleTag را به شکل Name#1234 وارد کنید"
        : null
      : null;

  const goBack =
    activeStep === "details"
      ? () => setStep("delivery")
      : activeStep === "delivery" && hasChoices
      ? () => setStep("options")
      : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (primaryDisabled) return;
    if (activeStep === "options") setStep("delivery");
    else if (activeStep === "delivery") setStep("details");
    else submitAdd();
  };

  const summaryRows: PurchaseSummaryRow[] = [
    { label: "محصول", value: productName },
    ...(regionInfo ? [{ label: "ریجن", value: regionInfo.value }] : []),
    ...(variationText
      ? [
          {
            label: "نسخه",
            value: variationText,
            onEdit: hasChoices ? () => setStep("options") : undefined,
          },
        ]
      : []),
    { label: "روش تحویل", value: deliveryLabel, onEdit: () => setStep("delivery") },
  ];

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
    : formValid
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

    if (formValid) {
      submitAdd();
      return;
    }

    setStep(purchase.deliveryType ? "details" : "delivery");
    document.getElementById(PRODUCT_HERO_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(
      purchase.deliveryType ? "لطفاً اطلاعات لازم را تکمیل کنید" : "ابتدا روش تحویل را انتخاب کنید",
      "error"
    );
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

      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-5">
        <div ref={stepperRef} className="scroll-mt-24">
          <PurchaseStepper items={stepperItems} onSelect={(id) => setStep(id as StepId)} />
        </div>

        <StepViewport>
          <div
            key={activeStep}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
          >
            {activeStep === "options" && (
              <div className="flex flex-col gap-4">
                <VariationSelector
                  groupedAttributes={groupedAttributes}
                  selectedAttrs={selectedAttrs}
                  onAttributeSelect={handleAttrSelect}
                  variations={variations}
                  regionInfo={regionInfo}
                  deliveryType={purchase.deliveryType}
                />
                {!selectedVariation && <UnavailableNotice />}
              </div>
            )}

            {activeStep === "delivery" &&
              (selectedVariation ? <DeliveryAndPrice step="delivery" purchase={purchase} /> : <UnavailableNotice />)}

            {activeStep === "details" && selectedVariation && (
              <div className="flex flex-col gap-4">
                <DeliveryAndPrice step="details" purchase={purchase} />
                <PurchaseSummary
                  rows={summaryRows}
                  price={purchase.currentPrice}
                  regularPrice={purchase.regularPrice}
                  specialDiscount={Boolean(selectedVariation.commissionDiscountBadge)}
                />
              </div>
            )}
          </div>
        </StepViewport>

        <PurchaseActions
          label={primaryLabel}
          disabled={primaryDisabled}
          onBack={goBack}
          burstKey={purchase.burstKey}
          hint={actionHint}
          notice={
            justAdded ? (
              <div
                role="status"
                className="flex items-center justify-between gap-3 border border-brand-sabz/30 bg-brand-sabz/10 px-3 py-2.5 text-xs font-bold text-brand-sabz animate-in fade-in duration-200"
              >
                <span className="flex items-center gap-1.5">
                  <Check size={14} strokeWidth={3} />
                  به سبد خرید اضافه شد
                </span>
                <Link href="/cart" className="text-white hover:underline">
                  مشاهده سبد خرید
                </Link>
              </div>
            ) : null
          }
        />
      </form>
    </>
  );
}