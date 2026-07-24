"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getClientCookie, setClientCookie, removeClientCookie } from "@/lib/cookies";
import { saveCredentials, getCredentials, removeCredentials } from "@/lib/secureCartStorage";
import { useToast } from "@/context/ToastContext";

const CART_COOKIE = "a2b_cart";
const CART_COOKIE_DAYS = 30;
export const MAX_CART_QUANTITY = 10;

const CAP_MESSAGE = `کاربر گرامی، سقف خرید ${MAX_CART_QUANTITY.toLocaleString("fa-IR")} عدد می‌باشد`;

export interface CartItem {
  id: string;
  productId: number;
  variationId?: number;
  name: string;
  price: number;
  regularPrice?: number;
  quantity: number;
  deliveryMethod: "direct" | "gift" | "code" | string;
  region?: string;
  variationName?: string;
  customFields?: {
    email?: string;
    password?: string;
    battleTag?: string;
    [key: string]: any;
  };
}

export type NewCartItem = Omit<CartItem, "id" | "quantity">;

function generateItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function itemsMatch(a: NewCartItem, b: CartItem): boolean {
  const ac = a.customFields || {};
  const bc = b.customFields || {};
  return (
    a.productId === b.productId &&
    (a.variationId || 0) === (b.variationId || 0) &&
    a.deliveryMethod === b.deliveryMethod &&
    (a.region || "") === (b.region || "") &&
    (ac.email || "") === (bc.email || "") &&
    (ac.password || "") === (bc.password || "") &&
    (ac.battleTag || "") === (bc.battleTag || "")
  );
}

function stripSensitiveFields(item: CartItem): CartItem {
  const { customFields, ...rest } = item;
  return rest as CartItem;
}

function isValidCartItem(item: unknown): item is CartItem {
  return typeof item === "object" && item !== null && "productId" in item && "quantity" in item;
}

function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidCartItem) : [];
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
  const cartRef = useRef<CartItem[]>([]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    const stored = parseStoredCart(getClientCookie(CART_COOKIE));
    const hydrated = stored.map((item) => ({
      ...item,
      customFields: getCredentials(item.id) || item.customFields,
    }));
    setCart(hydrated);
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

      if (currentTotal >= MAX_CART_QUANTITY) {
        showToast(CAP_MESSAGE, "error");
        return false;
      }

      const existing = cartRef.current.find((p) => itemsMatch(item, p));
      const id = existing ? existing.id : generateItemId();

      if (item.customFields) {
        saveCredentials(id, item.customFields);
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((p) => p.id === id);
        if (existingIndex !== -1) {
          return prev.map((p, idx) =>
            idx === existingIndex ? { ...p, quantity: p.quantity + 1 } : p
          );
        }
        return [...prev, { ...item, id, quantity: 1 }];
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
      if (quantity <= 0) {
        removeFromCart(id);
        return;
      }

      const currentCart = cartRef.current;
      const target = currentCart.find((i) => i.id === id);
      if (!target) return;

      const otherTotal = currentCart.reduce((sum, i) => (i.id === id ? sum : sum + i.quantity), 0);
      const capped = Math.min(quantity, Math.max(0, MAX_CART_QUANTITY - otherTotal));

      if (capped < quantity) {
        showToast(CAP_MESSAGE, "error");
      }

      if (capped <= 0) {
        removeFromCart(id);
        return;
      }

      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: capped } : item))
      );
    },
    [removeFromCart, showToast]
  );

  const updateCredentials = useCallback(
    (id: string, credentials: NonNullable<CartItem["customFields"]>) => {
      saveCredentials(id, credentials);
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, customFields: credentials } : item))
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    cartRef.current.forEach((item) => removeCredentials(item.id));
    setCart([]);
    removeClientCookie(CART_COOKIE);
  }, []);

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const totalQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

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