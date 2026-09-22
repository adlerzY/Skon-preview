"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getClientCookie, removeClientCookie } from "@/lib/cookies";
import { saveCredentials, getCredentials, removeCredentials } from "@/lib/secureCartStorage";
import { useToast } from "@/context/ToastContext";
import { MAX_CART_QUANTITY } from "@/lib/cartLimits";

const CART_COOKIE = "a2b_cart";
const CART_STORAGE_KEY = "a2b_cart_v2";
const CART_STORAGE_VERSION = 2;
const CART_STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CART_ITEMS = 10;

const CAP_MESSAGE = `کاربر گرامی، سقف خرید ${MAX_CART_QUANTITY.toLocaleString("fa-IR")} عدد می‌باشد`;

export interface CartItem {
  id: string;
  productId: number;
  variationId?: number;
  name: string;
  imageUrl?: string;
  price: number;
  regularPrice?: number;
  quantity: number;
  maxQuantity?: number;
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
    const items = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray(parsed.items)
        ? parsed.items
        : [];
    return items.filter(isValidCartItem).slice(0, MAX_CART_ITEMS);
  } catch {
    return [];
  }
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === CART_STORAGE_VERSION && typeof parsed?.savedAt === "number") {
        if (Date.now() - parsed.savedAt <= CART_STORAGE_TTL_MS) {
          return parseStoredCart(JSON.stringify(parsed.items));
        }
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  } catch {
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }

  const legacy = parseStoredCart(getClientCookie(CART_COOKIE));
  if (legacy.length) {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        version: CART_STORAGE_VERSION,
        savedAt: Date.now(),
        items: legacy.map(stripSensitiveFields).slice(0, MAX_CART_ITEMS),
      }));
      removeClientCookie(CART_COOKIE);
    } catch {}
  }
  return legacy;
}

function persistCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const sanitized = items.slice(0, MAX_CART_ITEMS).map(stripSensitiveFields);
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      version: CART_STORAGE_VERSION,
      savedAt: Date.now(),
      items: sanitized,
    }));
    removeClientCookie(CART_COOKIE);
  } catch {}
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
  updateItemSnapshot: (id: string, snapshot: { price?: number; regularPrice?: number; maxQuantity?: number | null }) => void;
  clearCart: () => void;
  clearSensitiveCredentials: () => void;
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
    const stored = readStoredCart();
    const hydrated = stored.map((item) => ({
      ...item,
      customFields: getCredentials(item.id) ?? undefined,
    }));
    setCart(hydrated);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      persistCart(cart);
    }, 150);
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

      if (existing && typeof item.maxQuantity === "number" && existing.quantity >= item.maxQuantity) {
        showToast(`موجودی این محصول محدود به ${item.maxQuantity.toLocaleString("fa-IR")} عدد است`, "error");
        return false;
      }

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
        if (prev.length >= MAX_CART_ITEMS) return prev;
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
      let capped = Math.min(quantity, Math.max(0, MAX_CART_QUANTITY - otherTotal));
      let cappedByStock = false;

      if (typeof target.maxQuantity === "number" && capped > target.maxQuantity) {
        capped = target.maxQuantity;
        cappedByStock = true;
      }

      if (capped < quantity) {
        if (cappedByStock) {
          showToast(`موجودی این محصول محدود به ${target.maxQuantity!.toLocaleString("fa-IR")} عدد است`, "error");
        } else {
          showToast(CAP_MESSAGE, "error");
        }
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

  const updateItemSnapshot = useCallback((id: string, snapshot: { price?: number; regularPrice?: number; maxQuantity?: number | null }) => {
    setCart((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        ...(typeof snapshot.price === "number" ? { price: snapshot.price } : {}),
        ...(typeof snapshot.regularPrice === "number" ? { regularPrice: snapshot.regularPrice } : {}),
        ...(snapshot.maxQuantity === null ? { maxQuantity: undefined } : typeof snapshot.maxQuantity === "number" ? { maxQuantity: snapshot.maxQuantity } : {}),
      };
    }));
  }, []);

  const clearSensitiveCredentials = useCallback(() => {
    cartRef.current.forEach((item) => removeCredentials(item.id));
    setCart((prev) => prev.map((item) => ({ ...item, customFields: undefined })));
  }, []);

  const clearCart = useCallback(() => {
    clearSensitiveCredentials();
    setCart([]);
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
    removeClientCookie(CART_COOKIE);
  }, [clearSensitiveCredentials]);

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
        updateItemSnapshot,
        clearCart,
        clearSensitiveCredentials,
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