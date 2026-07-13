import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import AuthRefresher from "@/components/account/AuthRefresher";

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
        <CartProvider>
          <AuthRefresher />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}