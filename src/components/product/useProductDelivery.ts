"use client";

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import type { VariationCard } from "@/lib/graphql";
import { BATTLETAG_REGEX, EMAIL_REGEX } from "./validation";

export type DeliveryType = "direct" | "gift" | "code";

function getDefaultDelivery(v: VariationCard): DeliveryType | null {
  const isDirectAvailable = v.parsedPrice != null;
  const isGiftAvailable = v.parsedGiftPrice != null && v.parsedGiftPrice !== "disabled";
  const isCodeAvailable =
    v.parsedCodePrice != null &&
    v.parsedCodePrice !== "disabled" &&
    (typeof v.codeStockCount !== "number" || v.codeStockCount > 0);

  if (isDirectAvailable) return "direct";
  if (isGiftAvailable) return "gift";
  if (isCodeAvailable) return "code";
  return null;
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

  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(() =>
    selectedVariation ? getDefaultDelivery(selectedVariation) : null
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [battleTag, setBattleTag] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (!selectedVariation) {
      setDeliveryType(null);
      return;
    }
    setDeliveryType(getDefaultDelivery(selectedVariation));
    setEmail("");
    setPassword("");
    setBattleTag("");
  }, [selectedVariation]);

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
    isFormValid,
    handleAddToCart,
    isCartFull,
  };
}

export type ProductPurchaseState = ReturnType<typeof useProductDelivery>;