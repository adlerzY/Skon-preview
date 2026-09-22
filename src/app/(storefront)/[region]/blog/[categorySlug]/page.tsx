import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBlogCategoryArchive, getAllBlogPosts } from "@/lib/graphql";
import BlogCategoryArchiveClient from "@/components/blog/BlogCategoryArchiveClient";
import FollowCategoryButtonAsync from "@/components/blog/FollowCategoryButtonAsync";
import FollowCategoryButtonSkeleton from "@/components/blog/FollowCategoryButtonSkeleton";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { makeMetadata, SEO_REGION } from "@/lib/seo/site";
import { BlogCategoryPostsLoadingShell } from "@/components/ui/BlogLoadingShells";

interface BlogCategoryPageProps {
  params: Promise<{ region: string; categorySlug: string }>;
}

interface MainCategoryRef {
  databaseId: number;
  name: string;
  slug: string;
}

interface SubCategoryRef {
  databaseId: number;
  name: string;
  slug: string;
}

async function BlogCategoryPosts({
  region,
  mainCategory,
  subCategories,
  initialSelectedSlug,
  catIds,
  catSlugsForTags,
}: {
  region: string;
  mainCategory: MainCategoryRef;
  subCategories: SubCategoryRef[];
  initialSelectedSlug: string;
  catIds: number[];
  catSlugsForTags: string[];
}) {
  const { posts, pageInfo } = await getAllBlogPosts({ categoryIds: catIds, categorySlugsForTags: catSlugsForTags });

  return (
    <BlogCategoryArchiveClient
      region={region}
      mainCategory={mainCategory}
      subCategories={subCategories}
      initialSelectedSlug={initialSelectedSlug}
      initialPosts={posts}
      initialPageInfo={pageInfo}
    />
  );
}

export async function generateMetadata({ params }: BlogCategoryPageProps): Promise<Metadata> {
  const { region, categorySlug } = await params;
  const category = await getBlogCategoryArchive(categorySlug);

  if (!category) {
    return {
      title: "دسته‌بندی پیدا نشد",
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  return makeMetadata({
    title: category.name,
    description: `آخرین اخبار و مقالات ${category.name} در وبلاگ Arena2Battle.`,
    path: region === SEO_REGION ? `/${SEO_REGION}/blog/${category.slug}` : undefined,
    noIndex: region !== SEO_REGION,
  });
}

export default async function BlogCategoryPage({ params }: BlogCategoryPageProps) {
  const { region, categorySlug } = await params;
  const category = await getBlogCategoryArchive(categorySlug);

  if (!category) notFound();

  const isSubCategory = Boolean(category.parent?.node);
  const mainCategory = isSubCategory ? category.parent!.node! : category;
  const subCategories = isSubCategory
    ? (category.parent!.node!.children?.nodes ?? [])
    : (category.children?.nodes ?? []);
  const initialSelectedSlug = isSubCategory ? category.slug : "all";

  const catIds = initialSelectedSlug === "all"
    ? [mainCategory.databaseId, ...subCategories.map((s: any) => s.databaseId)]
    : [category.databaseId];
  const catSlugsForTags = initialSelectedSlug === "all"
    ? [mainCategory.slug, ...subCategories.map((s: any) => s.slug)]
    : [category.slug];

  const pageTitle = isSubCategory ? category.name : mainCategory.name;
  const breadcrumbUrl = `/${region}/blog/${category.slug}`;

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 text-white max-w-site">
      {region === SEO_REGION && (
        <JsonLd data={breadcrumbSchema([
          { name: "فروشگاه", url: `/${SEO_REGION}` },
          { name: "وبلاگ", url: `/${SEO_REGION}/blog` },
          { name: pageTitle, url: breadcrumbUrl },
        ])} />
      )}
      <Breadcrumbs items={[{ label: "فروشگاه", href: `/${region}` }, { label: "وبلاگ", href: `/${region}/blog` }, { label: pageTitle }]} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue mb-2">{pageTitle}</h1>
          <p className="text-brand-m_khonsa text-sm">آخرین اخبار و مقالات این بخش</p>
        </div>
        <Suspense fallback={<FollowCategoryButtonSkeleton />}>
          <FollowCategoryButtonAsync
            categoryId={mainCategory.databaseId}
            initialFollowerCount={mainCategory.followerCount ?? 0}
          />
        </Suspense>
      </div>

      <Suspense fallback={<BlogCategoryPostsLoadingShell tabCount={subCategories.length} />}>
        <BlogCategoryPosts
          region={region}
          mainCategory={{ databaseId: mainCategory.databaseId, name: mainCategory.name, slug: mainCategory.slug }}
          subCategories={subCategories}
          initialSelectedSlug={initialSelectedSlug}
          catIds={catIds}
          catSlugsForTags={catSlugsForTags}
        />
      </Suspense>
    </main>
  );
}
