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
  region,
  category,
  productsPromise,
}: {
  region: string;
  category: any;
  productsPromise: Promise<any[]>;
}) {
  const allProducts = await productsPromise;
  const subcategories = category.children?.nodes ?? [];

  const groupedMap = new Map<string, any[]>();

  for (const subcategory of subcategories) {
    groupedMap.set(subcategory.slug, []);
  }

  const standaloneProducts: any[] = [];

  for (const product of allProducts) {
    const productCategorySlugs = new Set(
      (product.productCategories?.nodes ?? [])
        .map((cat: any) => cat.slug)
        .filter(Boolean),
    );

    let matchedSubcategory = false;

    for (const subcategory of subcategories) {
      if (!productCategorySlugs.has(subcategory.slug)) continue;

      groupedMap.get(subcategory.slug)?.push(product);
      matchedSubcategory = true;
    }

    if (!matchedSubcategory) {
      standaloneProducts.push(product);
    }
  }

  const groupedProducts = subcategories
    .map((subcat: any) => ({
      ...subcat,
      products: groupedMap.get(subcat.slug) ?? [],
    }))
    .filter((group: any) => group.products.length > 0);

  return (
    <>
      {groupedProducts.length > 0 && (
        <SubcategoryMenu subcategories={groupedProducts} />
      )}

      {standaloneProducts.length > 0 && (
        <div className="mt-8">
          <DynamicProductGrid
            products={standaloneProducts}
            activeRegion={region}
          />
        </div>
      )}

      {groupedProducts.length > 0 && (
        <div className="mt-8">
          {groupedProducts.map((group: any) => (
            <div
              key={group.id}
              id={`subcat-${group.slug}`}
              className="scroll-mt-36 my-12"
            >
              <DynamicProductGrid
                title={group.name}
                products={group.products}
                activeRegion={region}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { categorySlug, region } = await params;
  const category = await getCategoryShell(categorySlug);

  if (!category) {
    return {
      title: "دسته‌بندی پیدا نشد",
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    };
  }

  return makeMetadata({
    title: `خرید ${category.name}`,
    description: `مشاهده و خرید محصولات ${category.name} در Arena2Battle.`,
    path:
      region === SEO_REGION
        ? `/${SEO_REGION}/${category.slug}`
        : undefined,
    noIndex: region !== SEO_REGION,
  });
}

export default async function CategoryArchivePage({
  params,
}: CategoryPageProps) {
  const { categorySlug, region } = await params;

  const categoryPromise = getCategoryShell(categorySlug);
  const productsPromise = getCategoryProducts(categorySlug, region);

  const category = await categoryPromise;

  if (!category) notFound();

  const { name, banners } = category;
  const canonicalPath = `/${SEO_REGION}/${category.slug}`;

  return (
    <main className="container mx-auto px-6 max-w-site pb-12">
      {region === SEO_REGION && (
        <JsonLd
          data={breadcrumbSchema([
            {
              name: "فروشگاه",
              url: `/${SEO_REGION}`,
            },
            {
              name,
              url: canonicalPath,
            },
          ])}
        />
      )}

      <Breadcrumbs
        items={[
          {
            label: "فروشگاه",
            href: `/${region}`,
          },
          {
            label: name,
          },
        ]}
      />

      <CategoryHero
        banners={
          banners && banners.length > 0
            ? banners
            : [
                {
                  secondimage: "",
                  subtitle: "محصولات و خدمات",
                  link: "",
                  imageUrl: "",
                },
              ]
        }
      />

      <Suspense
        fallback={
          <div className="mt-8">
            <ProductGridSkeleton />
          </div>
        }
      >
        <CategoryProductGroups
          region={region}
          category={category}
          productsPromise={productsPromise}
        />
      </Suspense>
    </main>
  );
}
