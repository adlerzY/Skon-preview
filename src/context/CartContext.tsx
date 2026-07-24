"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getClientCookie, setClientCookie, removeClientCookie } from "@/lib/cookies";
import { saveCredentials, getCredentials, removeCredentials } from "@/lib/secureCartStorage";
import { useToast } from "@/context/ToastContext";

const CART_COOKIE = "a2b_cart";
const CART_COOKIE_DAYS = 30;
export const MAX_CART_QUANTITY = 10;
const CAP_MESSAGE = `کاربر گرامی، سقف خرید ${MAX_CART_QUANTITY.toLocaleString("fa-IR")} عدد می‌باشد`;

export interface CartItem {
  id: string;
  databaseId: number;
  productId?: number;
  variationId?: number;
  name: string;
  price: number;
  regularPrice?: number;
  deliveryMethod: "gift" | "code" | "direct";
  region?: string;
  variationName?: string;
  customFields?: {
    battleTag?: string;
    email?: string;
    password?: string;
  };
  quantity: number;
}

export type NewCartItem = Omit<CartItem, "id" | "quantity">;

function buildIdentityKey(item: NewCartItem): string {
  const cf = item.customFields || {};
  return [
    item.databaseId,
    item.deliveryMethod,
    item.region ?? "",
    item.variationName ?? "",
    cf.email ?? "",
    cf.password ?? "",
    cf.battleTag ?? "",
  ].join("::");
}

function stripSensitiveFields(item: CartItem): CartItem {
  const { customFields, ...rest } = item;
  return rest;
}

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.id === "string" &&
    typeof i.databaseId === "number" &&
    typeof i.name === "string" &&
    typeof i.price === "number" &&
    typeof i.quantity === "number" &&
    i.quantity > 0 &&
    ["gift", "code", "direct"].includes(i.deliveryMethod as string)
  );
}

function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartItem).map((item: CartItem) => {
      const credentials = getCredentials(item.id);
      return credentials ? { ...item, customFields: credentials } : item;
    });
  } catch {
    return [];
  }
}

export function itemNeedsCredentials(item: CartItem): boolean {
  if (item.deliveryMethod === "direct") {
    return !item.customFields?.email || !item.customFields?.password;
  }
  if (item.deliveryMethod === "gift") {
    return !item.customFields?.battleTag;
  }
  return false;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: NewCartItem) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCredentials: (id: string, credentials: NonNullable<CartItem["customFields"]>) => void;
  clearCart: () => void;
  totalPrice: number;
  totalQuantity: number;
  isCartFull: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const cartRef = useRef(cart);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    setCart(parseStoredCart(getClientCookie(CART_COOKIE)));
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      try {
        const sanitized = cart.map(stripSensitiveFields);
        setClientCookie(CART_COOKIE, JSON.stringify(sanitized), { days: CART_COOKIE_DAYS });
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [cart, isMounted]);

  const addToCart = useCallback(
    (item: NewCartItem): boolean => {
      const currentTotal = cartRef.current.reduce((sum, i) => sum + i.quantity, 0);
      if (currentTotal + 1 > MAX_CART_QUANTITY) {
        showToast(CAP_MESSAGE, "error");
        return false;
      }

      const key = buildIdentityKey(item);

      if (item.customFields) {
        saveCredentials(key, item.customFields);
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((p) => buildIdentityKey(p) === key);

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          return updated;
        }

        return [...prev, { ...item, id: key, quantity: 1 }];
      });

      return true;
    },
    [showToast]
  );

  const removeFromCart = useCallback((id: string) => {
    removeCredentials(id);
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      setCart((prev) => {
        if (quantity <= 0) {
          removeCredentials(id);
          return prev.filter((item) => item.id !== id);
        }

        const exists = prev.some((item) => item.id === id);
        if (!exists) return prev;

        const otherTotal = prev.reduce((sum, i) => (i.id === id ? sum : sum + i.quantity), 0);
        const capped = Math.min(quantity, Math.max(0, MAX_CART_QUANTITY - otherTotal));

        if (capped < quantity) {
          showToast(CAP_MESSAGE, "error");
        }

        if (capped <= 0) return prev;

        return prev.map((item) => (item.id === id ? { ...item, quantity: capped } : item));
      });
    },
    [showToast]
  );

  const updateCredentials = useCallback((id: string, credentials: NonNullable<CartItem["customFields"]>) => {
    saveCredentials(id, credentials);
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, customFields: credentials } : item)));
  }, []);

  const clearCart = useCallback(() => {
    cartRef.current.forEach((item) => removeCredentials(item.id));
    setCart([]);
    removeClientCookie(CART_COOKIE);
  }, []);

  const totalPrice = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const totalQuantity = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCredentials,
        clearCart,
        totalPrice,
        totalQuantity,
        isCartFull: totalQuantity >= MAX_CART_QUANTITY,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};