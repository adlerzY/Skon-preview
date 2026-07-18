import { getHomePageData } from "@/lib/graphql"; 
import CategoryHero from "@/components/Hero"; 
import SecondaryHero from "@/components/SecondaryHero";
import nextDynamic from "next/dynamic";
import Skeleton from "@/components/ui/Skeleton";

interface HomeProps {
  params: Promise<{ region: string }>;
}

const DynamicProductGrid = nextDynamic(() => import("@/components/ProductGrid"), {
  loading: () => (
    <div className="space-y-6 my-12">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[380px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  ), 
});

export default async function Home({ params }: HomeProps) {
  const { region } = await params;
  const { banners, featured, latest, heroTabs } = await getHomePageData(region);

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <CategoryHero banners={banners} />
      <DynamicProductGrid title="محصولات ویژه و پرطرفدار" products={featured} activeRegion={region} />
      {/* <SecondaryHero sectionTitle="پیشنهاد ویژه این هفته" tabs={heroTabs} /> */}
      <DynamicProductGrid title="جدیدترین محصولات" products={latest} activeRegion={region} />
      
    </main>
  );
}