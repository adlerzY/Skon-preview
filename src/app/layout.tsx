import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, SITE_NAME, SITE_URL, DEFAULT_OG_DESCRIPTION, viewport } from "@/lib/seo/site";

const yekanFont = localFont({
  src: "./fonts/Yekan.woff",
  variable: "--font-yekan",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export { viewport };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_SEO_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "gaming",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE_NAME,
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_OG_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_OG_DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa-IR" dir="rtl" data-scroll-behavior="smooth">
      <body className={`${yekanFont.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
