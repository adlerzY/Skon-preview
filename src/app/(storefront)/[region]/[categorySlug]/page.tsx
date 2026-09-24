import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategoryShell, getCategoryProducts } from "@/lib/graphql";
import CategoryHero from "@/components/Hero";
import SubcategoryMenu from "@/components/ui/SubcategoryMenu";
import DynamicProductGrid from "@/components/ProductGrid";
import { ProductGridSkeleton } from "@/components/home/HomeSkeletons";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string; region: string }>;
}

async function CategoryProductGroups({
  categorySlug,
  region,
  category,
}: {
  categorySlug: string;
  region: string;
  category: any;
}) {
  const allProducts = await getCategoryProducts(categorySlug, region);
  const subcategories = category.children?.nodes ?? [];

  const groupedProducts = subcategories
    .map((subcat: any) => {
      const productsInSubcat = allProducts.filter((product: any) =>
        product.productCategories?.nodes?.some((cat: any) => cat.slug === subcat.slug)
      );
      return { ...subcat, products: productsInSubcat };
    })
    .filter((group: any) => group.products.length > 0);

  const standaloneProducts = allProducts.filter((product: any) =>
    !subcategories.some((subcat: any) =>
      product.productCategories?.nodes?.some((cat: any) => cat.slug === subcat.slug)
    )
  );

  return (
    <>
      {groupedProducts.length > 0 && <SubcategoryMenu subcategories={groupedProducts} />}

      {standaloneProducts.length > 0 && (
        <div className="mt-8">
          <DynamicProductGrid products={standaloneProducts} activeRegion={region} />
        </div>
      )}

      {groupedProducts.length > 0 && (
        <div className="mt-8">
          {groupedProducts.map((group: any) => (
            <div key={group.id} id={`subcat-${group.slug}`} className="scroll-mt-36 my-12">
              <DynamicProductGrid title={group.name} products={group.products} activeRegion={region} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default async function CategoryArchivePage({ params }: CategoryPageProps) {
  const { categorySlug, region } = await params;
  const category = await getCategoryShell(categorySlug);

  if (!category) notFound();

  const { name, banners } = category;

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <CategoryHero
        banners={banners && banners.length > 0 ? banners : [{ secondimage: "", subtitle: `محصولات و خدمات ${name}`, link: "", imageUrl: "" }]}
      />

      <Suspense fallback={<div className="mt-8"><ProductGridSkeleton /></div>}>
        <CategoryProductGroups categorySlug={categorySlug} region={region} category={category} />
      </Suspense>
    </main>
  );
}
