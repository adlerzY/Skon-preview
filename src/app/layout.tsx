import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header/Header";
import SubHeaderBar from "@/components/Header/SubHeaderBar";
import { CartProvider } from "@/context/CartContext";

const yekanFont = localFont({
  src: "./fonts/Yekan.woff",
  variable: "--font-yekan",
});

export const metadata: Metadata = {
  title: "Arena2Battle — فروشگاه گیم",
  description: "خرید بازی، گیفت کارت و خدمات آنلاین گیمینگ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${yekanFont.variable} font-sans antialiased`}>
        <CartProvider>
          <Header />
          <SubHeaderBar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
