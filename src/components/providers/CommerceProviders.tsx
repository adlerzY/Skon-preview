"use client";

import { Suspense, type ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { HeaderViewerProvider } from "@/components/Header/HeaderViewerProvider";
import AuthRefresher from "@/components/account/AuthRefresher";
import TopLoader from "@/components/ui/TopLoader";

export default function CommerceProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>
        <HeaderViewerProvider>
          <AuthRefresher />
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          {children}
        </HeaderViewerProvider>
      </CartProvider>
    </ToastProvider>
  );
}