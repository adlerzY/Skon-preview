import Link from "next/link";
import { searchProductsByKeyword } from "@/actions/search";
import ProductGrid from "@/components/ProductGrid";

interface SearchPageProps {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ q?: string; after?: string; before?: string }>;
}

function buildSearchUrl(region: string, query: string, cursorKey?: "after" | "before", cursor?: string | null): string {
  const params = new URLSearchParams({ q: query });
  if (cursorKey && cursor) params.set(cursorKey, cursor);
  return `/${encodeURIComponent(region)}/search?${params.toString()}`;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { region } = await params;
  const { q, after, before } = await searchParams;
  const query = (q || "").trim().slice(0, 100);
  const result = query
    ? await searchProductsByKeyword(query, region, { after, before, first: 24, last: 24 })
    : { products: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null } };

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <ProductGrid
        products={result.products}
        title={query ? `نتایج جستجو برای «${query}»` : "جستجوی محصولات"}
        activeRegion={region}
      />

      {query && (result.pageInfo.hasPreviousPage || result.pageInfo.hasNextPage) ? (
        <nav className="mt-6 flex items-center justify-center gap-2" aria-label="صفحات جستجو">
          {result.pageInfo.hasPreviousPage && result.pageInfo.startCursor ? (
            <Link
              href={buildSearchUrl(region, query, "before", result.pageInfo.startCursor)}
              prefetch={false}
              className="border border-white/[.08] bg-brand-surface px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[.05]"
            >
              نتایج قبلی
            </Link>
          ) : null}
          {result.pageInfo.hasNextPage && result.pageInfo.endCursor ? (
            <Link
              href={buildSearchUrl(region, query, "after", result.pageInfo.endCursor)}
              prefetch={false}
              className="border border-white/[.08] bg-brand-surface px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[.05]"
            >
              نتایج بعدی
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
