import { notFound, redirect } from "next/navigation";
import { getProductDetail } from "@/lib/graphql";
import ProductPageClient from "@/components/product/ProductPageClient";
import { cookies } from "next/headers";

interface ProductPageProps {
  params: Promise<{
    categorySlug: string;
    productSlug?: string;
    slug?: string;
    region: string;
  }>;
  searchParams: Promise<{
    edition?: string;
    region?: string;
  }>;
}

export const dynamic = "force-dynamic";
const KNOWN_REGIONS = ["eu", "us", "tr"];

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentSlug = resolvedParams.productSlug || resolvedParams.slug;

  if (!currentSlug) {
    notFound();
  }

  const urlRegion = resolvedParams.region?.toLowerCase();
  const cookieStore = await cookies();
  const cookieRegion = cookieStore.get("store_region")?.value || "eu";

  if (!KNOWN_REGIONS.includes(urlRegion)) {
    redirect(`/${cookieRegion}/${resolvedParams.categorySlug}/${currentSlug}`);
  }
  const activeRegion = urlRegion || resolvedSearchParams.region || cookieRegion;

  const product = await getProductDetail(currentSlug, activeRegion);

  if (!product) {
    notFound();
  }

  return (
    <main className="container mx-auto px-6 py-5 max-w-site">
      <ProductPageClient
        product={product}
        initialEdition={resolvedSearchParams.edition}
        activeRegion={activeRegion}
      />
    </main>
  );
}