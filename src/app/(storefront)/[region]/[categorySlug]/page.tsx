import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategoryShell, getCategoryProducts } from "@/lib/graphql";
import CategoryHero from "@/components/Hero";
import SubcategoryMenu from "@/components/ui/SubcategoryMenu";
import DynamicProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { makeMetadata, SEO_REGION } from "@/lib/seo/site";
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

  if (standaloneProducts.length > 0) {
    groupedProducts.unshift({
      id: category.id,
      databaseId: category.databaseId,
      name: category.name,
      slug: category.slug,
      products: standaloneProducts,
    });
  }

  return (
    <>
      {groupedProducts.length > 1 && <SubcategoryMenu subcategories={groupedProducts} />}
      <div className="mt-8">
        {groupedProducts.map((group: any) => (
          <div key={group.id} id={`subcat-${group.slug}`} className="scroll-mt-36 my-12">
            <DynamicProductGrid title={group.name} products={group.products} activeRegion={region} />
          </div>
        ))}
      </div>
    </>
  );
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug, region } = await params;
  const category = await getCategoryShell(categorySlug);
  if (!category) {
    return {
      title: "دسته‌بندی پیدا نشد",
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  return makeMetadata({
    title: `خرید ${category.name}`,
    description: `مشاهده و خرید محصولات ${category.name} در Arena2Battle.`,
    path: region === SEO_REGION ? `/${SEO_REGION}/${category.slug}` : undefined,
    noIndex: region !== SEO_REGION,
  });
}

export default async function CategoryArchivePage({ params }: CategoryPageProps) {
  const { categorySlug, region } = await params;
  const category = await getCategoryShell(categorySlug);

  if (!category) notFound();

  const { name, banners } = category;
  const canonicalPath = `/${SEO_REGION}/${category.slug}`;

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      {region === SEO_REGION && (
        <JsonLd data={breadcrumbSchema([
          { name: "فروشگاه", url: `/${SEO_REGION}` },
          { name, url: canonicalPath },
        ])} />
      )}
      <Breadcrumbs
        items={[
          { label: "فروشگاه", href: `/${region}` },
          { label: name },
        ]}
      />
      <CategoryHero
        heading={name}
        banners={banners && banners.length > 0 ? banners : [{ title: name, subtitle: `محصولات و خدمات ${name}` }]}
      />

      <Suspense fallback={<div className="mt-8"><ProductGridSkeleton /></div>}>
        <CategoryProductGroups categorySlug={categorySlug} region={region} category={category} />
      </Suspense>
    </main>
  );
}
