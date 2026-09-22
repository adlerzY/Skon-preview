import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header/Header";
import SubHeaderBar from "@/components/Header/SubHeaderBar";
import Footer from "@/components/Footer/Footer";
import { DEFAULT_REGION, KNOWN_REGIONS } from "@/lib/regions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "سبد خرید",
};

export default async function CartLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieRegion = cookieStore.get("store_region")?.value?.toLowerCase();
  const activeRegion = cookieRegion && KNOWN_REGIONS.includes(cookieRegion) ? cookieRegion : DEFAULT_REGION;

  return (
    <>
      <Header activeRegion={activeRegion} />
      <SubHeaderBar />
      {children}
      <Footer activeRegion={activeRegion} />
    </>
  );
}
