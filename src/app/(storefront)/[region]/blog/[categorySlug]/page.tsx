import { notFound } from "next/navigation";
import { getBlogCategoryArchive, getAllBlogPosts, fetchGraphQL } from "@/lib/graphql";
import { GET_FOLLOW_STATUS_QUERY } from "@/lib/graphql/blog";
import { getCurrentUser, getAuthToken } from "@/lib/auth/session";
import BlogCategoryArchiveClient from "@/components/blog/BlogCategoryArchiveClient";
import FollowCategoryButton from "@/components/blog/FollowCategoryButton";

interface BlogCategoryPageProps {
  params: Promise<{ region: string; categorySlug: string }>;
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

  const [{ posts, pageInfo }, user, token] = await Promise.all([
    getAllBlogPosts({ categoryIds: catIds, categorySlugsForTags: catSlugsForTags }),
    getCurrentUser().catch(() => null),
    getAuthToken(),
  ]);

  let isFollowing = false;
  if (token) {
    const followData = await fetchGraphQL(
      GET_FOLLOW_STATUS_QUERY,
      { id: String(mainCategory.databaseId) },
      [],
      "no-store",
      token
    );
    isFollowing = Boolean(followData?.category?.isFollowedByViewer);
  }

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 text-white max-w-site">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-blue mb-2">{mainCategory.name}</h1>
          <p className="text-brand-m_khonsa text-sm">آخرین اخبار و مقالات این بخش</p>
        </div>
        <FollowCategoryButton
          categoryId={mainCategory.databaseId}
          initialFollowerCount={mainCategory.followerCount ?? 0}
          isLoggedIn={Boolean(user)}
          initialIsFollowing={isFollowing}
        />
      </div>

      <BlogCategoryArchiveClient
        region={region}
        mainCategory={{ databaseId: mainCategory.databaseId, slug: mainCategory.slug }}
        subCategories={subCategories}
        initialSelectedSlug={initialSelectedSlug}
        initialPosts={posts}
        initialPageInfo={pageInfo}
      />
    </main>
  );
}