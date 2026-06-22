import { getHomePageData } from "@/lib/graphql"; 
import CategoryHero from "@/components/Hero"; 
import nextDynamic from "next/dynamic";

interface HomeProps {
  params: Promise<{
    region: string;
  }>;
}

export const dynamic = "force-dynamic";

const DynamicProductGrid = nextDynamic(() => import("@/components/ProductGrid"), {
  loading: () => (
    <div className="w-full my-4 h-[400px] bg-[#1c1e25]/40 backdrop-blur-xl border border-white/5 animate-pulse"></div>
  ), 
});

export default async function Home({ params }: HomeProps) {
  const { region } = await params;
  const activeRegion = region || "eu";

  const { banners, featured, latest } = await getHomePageData(activeRegion);

  return (
    <main className="container mx-auto px-6 max-w-[1600px] pb-12">
      <CategoryHero banners={banners} />
      <DynamicProductGrid title="محصولات ویژه و پرطرفدار" products={featured} activeRegion={activeRegion} />
      <DynamicProductGrid title="جدیدترین محصولات" products={latest} activeRegion={activeRegion} />
    </main>
  );
}