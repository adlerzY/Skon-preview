import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeFeaturedGrid from "@/components/home/HomeFeaturedGrid";
import HomeLatestGrid from "@/components/home/HomeLatestGrid";
import JsonLd from "@/components/seo/JsonLd";
import { HeroLayoutShell, ProductGridLayoutShell } from "@/components/home/HomeSkeletons";
import { organizationSchema, websiteSchema } from "@/lib/seo/jsonld";
import { makeMetadata, DEFAULT_SEO_DESCRIPTION, SEO_REGION } from "@/lib/seo/site";
import type { Metadata } from "next";

interface HomeProps {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { region } = await params;
  if (region !== SEO_REGION) {
    return {
      title: "فروشگاه بازی و خدمات گیمینگ",
      robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    };
  }

  return makeMetadata({
    title: "فروشگاه بازی، گیفت‌کارت و خدمات گیمینگ",
    description: DEFAULT_SEO_DESCRIPTION,
    path: `/${SEO_REGION}`,
  });
}

export default async function Home({ params }: HomeProps) {
  const { region } = await params;
  const isSeoRegion = region === SEO_REGION;

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      {isSeoRegion && (
        <JsonLd
          data={[
            websiteSchema(),
            organizationSchema(),
          ]}
        />
      )}

      <Suspense fallback={<HeroLayoutShell />}>
        <HomeHero />
      </Suspense>

      <section className="w-full my-4">
        <div className="flex items-center justify-between mt-5 mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            محصولات ویژه و پرطرفدار
          </h2>
        </div>
        <Suspense fallback={<ProductGridLayoutShell showTitle={false} />}>
          <HomeFeaturedGrid region={region} />
        </Suspense>
      </section>

      <section className="w-full my-4">
        <div className="flex items-center justify-between mt-5 mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            جدیدترین محصولات
          </h2>
        </div>
        <Suspense fallback={<ProductGridLayoutShell showTitle={false} />}>
          <HomeLatestGrid region={region} />
        </Suspense>
      </section>
    </main>
  );
}
