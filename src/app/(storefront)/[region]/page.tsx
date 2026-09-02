import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeFeaturedGrid from "@/components/home/HomeFeaturedGrid";
import HomeLatestGrid from "@/components/home/HomeLatestGrid";
import { HeroSkeleton, ProductGridSkeleton } from "@/components/home/HomeSkeletons";

interface HomeProps {
  params: Promise<{ region: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { region } = await params;

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <Suspense fallback={<HeroSkeleton />}>
        <HomeHero />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <HomeFeaturedGrid region={region} />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <HomeLatestGrid region={region} />
      </Suspense>
    </main>
  );
}