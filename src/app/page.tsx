import { getHomePageData } from "@/lib/wp-graphql"; 
import CategoryHero from "@/components/Hero"; 
import dynamic from "next/dynamic";

const DynamicProductGrid = dynamic(() => import("@/components/ProductGrid"), {
  loading: () => (
    <div className="w-full my-4 h-[400px] bg-[#1c1e25]/40 backdrop-blur-xl border border-white/5 rounded-2xl animate-pulse"></div>
  ), 
});

export default async function Home() {
  const { banners, featured, latest } = await getHomePageData();

  return (
    <main className="container mx-auto px-6 max-w-[1600px] pb-12">
      <CategoryHero banners={banners} />

      {/* فراخوانی به صورت Lazy Load */}
      <DynamicProductGrid title="محصولات ویژه و پرطرفدار" products={featured} />
      
      <DynamicProductGrid title="جدیدترین محصولات" products={latest} />
    </main>
  );
}