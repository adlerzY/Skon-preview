import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeFeaturedGrid from "@/components/home/HomeFeaturedGrid";
import HomeLatestGrid from "@/components/home/HomeLatestGrid";
import { HeroLayoutShell, ProductGridLayoutShell } from "@/components/home/HomeSkeletons";

interface HomeProps {
  params: Promise<{ region: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { region } = await params;

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
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
