import { getHomeFeaturedProducts } from "@/lib/graphql";
import ProductGrid from "@/components/ProductGrid";

export default async function HomeFeaturedGrid({ region }: { region: string }) {
  const products = await getHomeFeaturedProducts(region);
  return <ProductGrid title="محصولات ویژه و پرطرفدار" products={products} activeRegion={region} />;
}