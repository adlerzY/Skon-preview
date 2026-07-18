import ProductCard from "./ProductCard";
import { ProductNode } from "@/lib/graphql";

interface ProductGridProps {
  products: ProductNode[];
  title: string;
  activeRegion?: string;
}

export default function ProductGrid({ products, title, activeRegion }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="w-full my-4 bg-brand-surface backdrop-blur-xl border border-white/5 p-10 flex flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-brand-m_khonsa font-semibold text-lg">به نظر می‌رسه تو این ریجن چیزی نداریم 🌍</p>
        <p className="text-brand-surface_m text-sm">یه ریجن دیگه رو از بالای سایت امتحان کن</p>
      </div>
    );
  }

  return (
    <section className="w-full my-4 overflow-hidden">
      <div className="flex items-center justify-between mt-5 mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            activeRegion={activeRegion}
          />
        ))}
      </div>
    </section>
  );
}