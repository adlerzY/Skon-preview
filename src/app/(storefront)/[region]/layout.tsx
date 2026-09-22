import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header/Header";
import SubHeaderBar from "@/components/Header/SubHeaderBar";
import Footer from "@/components/Footer/Footer";
import { DEFAULT_REGION, KNOWN_REGIONS } from "@/lib/regions";
import { DEFAULT_SEO_DESCRIPTION, SEO_REGION, makeMetadata, absoluteUrl } from "@/lib/seo/site";

export const revalidate = 900;
export const dynamicParams = false;

export function generateStaticParams() {
  return KNOWN_REGIONS.map((region) => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const isSeoRegion = region === SEO_REGION;

  if (isSeoRegion) {
    return makeMetadata({
      title: "فروشگاه بازی و خدمات گیمینگ",
      description: DEFAULT_SEO_DESCRIPTION,
      path: `/${SEO_REGION}`,
    });
  }

  return {
    title: "فروشگاه بازی و خدمات گیمینگ",
    description: DEFAULT_SEO_DESCRIPTION,
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: "Arena2Battle",
      title: "فروشگاه بازی و خدمات گیمینگ | Arena2Battle",
      description: DEFAULT_SEO_DESCRIPTION,
      url: absoluteUrl(`/${region}`),
    },
  };
}

export default async function RegionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  const activeRegion = KNOWN_REGIONS.includes(region.toLowerCase()) ? region.toLowerCase() : DEFAULT_REGION;

  return (
    <>
      <Header activeRegion={activeRegion} />
      <SubHeaderBar />
      {children}
      <Footer activeRegion={activeRegion} />
    </>
  );
}
