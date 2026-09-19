import { searchProductsByKeyword } from "@/actions/search";
import ProductGrid from "@/components/ProductGrid";

interface SearchPageProps {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { region } = await params;
  const { q } = await searchParams;
  const query = (q || "").trim().slice(0, 100);
  const products = query ? await searchProductsByKeyword(query) : [];

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <ProductGrid
        products={products}
        title={query ? `نتایج جستجو برای «${query}»` : "جستجوی محصولات"}
        activeRegion={region}
      />
    </main>
  );
}
