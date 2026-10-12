import { getHomeLatestProducts } from "@/lib/graphql";
import ProductGrid from "@/components/ProductGrid";

export default async function HomeLatestGrid({ region }: { region: string }) {
  const products = await getHomeLatestProducts(region);

  if (products === null) {
    return (
      <div className="w-full my-4 bg-brand-surface backdrop-blur-xl border border-white/5 p-10 flex flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-brand-m_khonsa font-semibold text-lg">دریافت جدیدترین محصولات موقتاً با مشکل مواجه شد</p>
        <p className="text-brand-surface_m text-sm">این به معنی ناموجود بودن محصولات در این ریجن نیست.</p>
      </div>
    );
  }

  return <ProductGrid title="جدیدترین محصولات" products={products} activeRegion={region} showTitle={false} />;
}
