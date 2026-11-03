"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import type { VariationCard } from "@/lib/graphql";
import { BATTLETAG_REGEX, EMAIL_REGEX } from "./validation";

export type DeliveryType = "direct" | "gift" | "code";

export const DELIVERY_TYPES: readonly DeliveryType[] = ["direct", "gift", "code"];

export const DELIVERY_LABELS: Record<DeliveryType, string> = {
  direct: "مستقیم",
  gift: "گیفت",
  code: "کد اصلی",
};

export interface DeliveryOptionState {
  type: DeliveryType;
  available: boolean;
  price: number | null;
  regularPrice: number | null;
  stockCount: number | null;
  reason: string | null;
}

export function isDeliveryAvailable(v: VariationCard, type: DeliveryType): boolean {
  switch (type) {
    case "direct":
      return v.parsedPrice != null;
    case "gift":
      return v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled";
    case "code":
      return (
        v.parsedCodePrice != null &&
        v.parsedCodePrice !== "disabled" &&
        (typeof v.codeStockCount !== "number" || v.codeStockCount > 0)
      );
  }
}

export function hasAnyDelivery(v: VariationCard | null): boolean {
  return v ? DELIVERY_TYPES.some((type) => isDeliveryAvailable(v, type)) : false;
}

function getPrice(v: VariationCard, type: DeliveryType): number | null {
  switch (type) {
    case "direct":
      return v.parsedPrice ?? null;
    case "gift":
      return typeof v.parsedGiftPrice === "number" ? v.parsedGiftPrice : null;
    case "code":
      return typeof v.parsedCodePrice === "number" ? v.parsedCodePrice : null;
  }
}

function getRegularPrice(v: VariationCard, type: DeliveryType): number | null {
  switch (type) {
    case "direct":
      return v.parsedRegularPrice ?? null;
    case "gift":
      return typeof v.parsedGiftRegularPrice === "number" ? v.parsedGiftRegularPrice : null;
    case "code":
      return typeof v.parsedCodeRegularPrice === "number" ? v.parsedCodeRegularPrice : null;
  }
}

function unavailableReason(v: VariationCard | null, type: DeliveryType): string {
  if (
    type === "code" &&
    v &&
    typeof v.parsedCodePrice === "number" &&
    typeof v.codeStockCount === "number" &&
    v.codeStockCount <= 0
  ) {
    return "موجودی کد این نسخه تمام شده است";
  }
  return "این روش برای مشخصات انتخاب‌شده فعال نیست";
}

interface UseProductDeliveryArgs {
  selectedVariation: VariationCard | null;
  productId: number;
  productName: string;
  selectedAttrs: Record<string, string>;
  groupedAttributes: { name: string; values: unknown[] }[];
  regionInfo: { name: string; value: string } | null;
}

export function useProductDelivery({
  selectedVariation,
  productId,
  productName,
  selectedAttrs,
  groupedAttributes,
  regionInfo,
}: UseProductDeliveryArgs) {
  const { addToCart, isCartFull } = useCart();
  const { showToast } = useToast();

  const [chosenDelivery, setDeliveryType] = useState<DeliveryType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [battleTag, setBattleTag] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const deliveryType: DeliveryType | null =
    selectedVariation && chosenDelivery && isDeliveryAvailable(selectedVariation, chosenDelivery)
      ? chosenDelivery
      : null;

  useEffect(() => {
    if (chosenDelivery && !(selectedVariation && isDeliveryAvailable(selectedVariation, chosenDelivery))) {
      setDeliveryType(null);
    }
  }, [selectedVariation, chosenDelivery]);

  const isDirectDisabled = !selectedVariation || selectedVariation.parsedPrice == null;
  const isGiftDisabled =
    !selectedVariation ||
    selectedVariation.parsedGiftPrice == null ||
    selectedVariation.parsedGiftPrice === "disabled";
  const isCodeDisabled =
    !selectedVariation ||
    selectedVariation.parsedCodePrice == null ||
    selectedVariation.parsedCodePrice === "disabled" ||
    (typeof selectedVariation.codeStockCount === "number" && selectedVariation.codeStockCount <= 0);

  const currentPrice = selectedVariation && deliveryType ? getPrice(selectedVariation, deliveryType) : null;
  const regularPrice = selectedVariation && deliveryType ? getRegularPrice(selectedVariation, deliveryType) : null;

  const options = useMemo<DeliveryOptionState[]>(
    () =>
      DELIVERY_TYPES.map((type) => {
        const available = Boolean(selectedVariation && isDeliveryAvailable(selectedVariation, type));
        return {
          type,
          available,
          price: available && selectedVariation ? getPrice(selectedVariation, type) : null,
          regularPrice: available && selectedVariation ? getRegularPrice(selectedVariation, type) : null,
          stockCount:
            type === "code" && selectedVariation && typeof selectedVariation.codeStockCount === "number"
              ? selectedVariation.codeStockCount
              : null,
          reason: available ? null : unavailableReason(selectedVariation, type),
        };
      }),
    [selectedVariation]
  );

  const isFormValid = useCallback((): boolean => {
    if (!deliveryType) return false;
    if (deliveryType === "direct") return EMAIL_REGEX.test(email.trim()) && password.trim().length > 0;
    if (deliveryType === "gift") return BATTLETAG_REGEX.test(battleTag.trim());
    if (deliveryType === "code") return true;
    return false;
  }, [deliveryType, email, password, battleTag]);

  const handleAddToCart = useCallback((): boolean => {
    if (!isFormValid() || !deliveryType || !selectedVariation || currentPrice === null) return false;

    setIsAddingToCart(true);

    const regionValue = regionInfo ? selectedAttrs[regionInfo.name] : undefined;
    const traitValues = groupedAttributes
      .map((g) => selectedAttrs[g.name])
      .filter(Boolean);
    const variationNameValue = traitValues.length > 0 ? traitValues.join(" - ") : undefined;
    const deliveryVariationId = selectedVariation.variationIdsByDelivery?.[deliveryType];
    const variationIdValue =
      deliveryVariationId && deliveryVariationId !== productId
        ? deliveryVariationId
        : selectedVariation.databaseId !== productId
          ? selectedVariation.databaseId
          : undefined;

    const added = addToCart({
      productId,
      variationId: variationIdValue,
      name: productName,
      imageUrl: selectedVariation.imageUrl?.trim() || undefined,
      price: currentPrice,
      regularPrice: regularPrice ?? undefined,
      deliveryMethod: deliveryType,
      region: regionValue,
      variationName: variationNameValue,
      maxQuantity:
        deliveryType === "code" && typeof selectedVariation.codeStockCount === "number"
          ? selectedVariation.codeStockCount
          : undefined,
      customFields:
        deliveryType === "gift"
          ? { battleTag }
          : deliveryType === "direct"
          ? { email, password }
          : undefined,
    });

    if (added) {
      showToast("به سبد خرید اضافه شد 🛒");
      setBurstKey((k) => k + 1);
    }

    setTimeout(() => setIsAddingToCart(false), 1000);
    return added;
  }, [
    isFormValid,
    deliveryType,
    selectedVariation,
    regionInfo,
    selectedAttrs,
    groupedAttributes,
    addToCart,
    productId,
    productName,
    currentPrice,
    regularPrice,
    battleTag,
    email,
    password,
    showToast,
  ]);

  return {
    deliveryType,
    setDeliveryType,
    email,
    setEmail,
    password,
    setPassword,
    battleTag,
    setBattleTag,
    isAddingToCart,
    burstKey,
    isDirectDisabled,
    isGiftDisabled,
    isCodeDisabled,
    currentPrice,
    regularPrice,
    options,
    isFormValid,
    handleAddToCart,
    isCartFull,
  };
}

export type ProductPurchaseState = ReturnType<typeof useProductDelivery>;