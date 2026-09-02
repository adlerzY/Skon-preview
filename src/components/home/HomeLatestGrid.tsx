import { getHomeLatestProducts } from "@/lib/graphql";
import ProductGrid from "@/components/ProductGrid";

export default async function HomeLatestGrid({ region }: { region: string }) {
  const products = await getHomeLatestProducts(region);
  return <ProductGrid title="جدیدترین محصولات" products={products} activeRegion={region} />;
}