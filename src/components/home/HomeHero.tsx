import { getHomeHeroData } from "@/lib/graphql";
import CategoryHero from "@/components/Hero";

export default async function HomeHero() {
  const { banners } = await getHomeHeroData();
  return <CategoryHero heading="فروشگاه بازی، گیفت‌کارت و خدمات گیمینگ" banners={banners} />;
}