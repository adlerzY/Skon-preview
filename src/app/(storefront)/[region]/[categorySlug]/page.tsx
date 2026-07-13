import { getCategoryArchive } from "@/lib/graphql";
import CategoryHero from "@/components/Hero"; 
import { notFound } from "next/navigation";
import SubcategoryMenu from "@/components/ui/SubcategoryMenu";
import DynamicProductGrid from "@/components/ProductGrid";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string; region: string }>;
}

export default async function CategoryArchivePage({ params }: CategoryPageProps) {
  const { categorySlug, region } = await params;
  const categoryData = await getCategoryArchive(categorySlug, region);

  if (!categoryData) notFound();

  const { name, slug, products, banners, children } = categoryData;
  const allProducts = products?.nodes || [];
  const subcategories = children?.nodes || [];

  const groupedProducts = subcategories.map((subcat: any) => {
    const productsInSubcat = allProducts.filter((product: any) =>
      product.productCategories?.nodes?.some((cat: any) => cat.slug === subcat.slug)
    );
    return { ...subcat, products: productsInSubcat };
  }).filter((group: any) => group.products.length > 0);

  const standaloneProducts = allProducts.filter((product: any) =>
    !subcategories.some((subcat: any) =>
      product.productCategories?.nodes?.some((cat: any) => cat.slug === subcat.slug)
    )
  );

  if (standaloneProducts.length > 0) {
    groupedProducts.unshift({
      id: categoryData.id,
      databaseId: categoryData.databaseId,
      name: name,
      slug: slug,
      products: standaloneProducts,
    });
  }

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      <CategoryHero 
        banners={banners && banners.length > 0 ? banners : [{ title: name, subtitle: `محصولات و خدمات ${name}` }]}
      />
      {groupedProducts.length > 1 && <SubcategoryMenu subcategories={groupedProducts} />}
      <div className="mt-8">
        {groupedProducts.map((group: any) => (
          <div key={group.id} id={`subcat-${group.slug}`} className="scroll-mt-36 my-12">
            <DynamicProductGrid title={group.name} products={group.products} activeRegion={region} />
          </div>
        ))}
      </div>
    </main>
  );
}