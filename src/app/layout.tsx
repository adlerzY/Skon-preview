import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import AuthRefresher from "@/components/account/AuthRefresher";
import TopLoader from "@/components/ui/TopLoader";

const yekanFont = localFont({
  src: "./fonts/Yekan.woff",
  variable: "--font-yekan",
});

export const metadata: Metadata = {
  title: "Arena2Battle — فروشگاه گیم",
  description: "خرید بازی، گیفت کارت و خدمات آنلاین گیمینگ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${yekanFont.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        <ToastProvider>
          <CartProvider>
            <AuthRefresher />
            {children}
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}