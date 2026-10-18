import { getHomeFeaturedProducts } from "@/lib/graphql";
import ProductGrid from "@/components/ProductGrid";

export default async function HomeFeaturedGrid({ region }: { region: string }) {
  const products = await getHomeFeaturedProducts(region);

  if (products === null) {
    return (
      <div className="w-full my-4 bg-brand-surface backdrop-blur-xl border border-white/5 p-10 flex flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-brand-m_khonsa font-semibold text-lg">دریافت محصولات ویژه موقتاً با مشکل مواجه شد</p>
        <p className="text-brand-surface_m text-sm">این به معنی ناموجود بودن محصولات در این ریجن نیست.</p>
      </div>
    );
  }

  return <ProductGrid title="محصولات ویژه و پرطرفدار" products={products} activeRegion={region} showTitle={false} />;
}