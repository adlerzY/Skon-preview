import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBlogTagArchive, getAllBlogPosts } from "@/lib/graphql";
import LoadMorePosts from "@/components/blog/LoadMorePosts";
import { BlogTagPostsLoadingShell } from "@/components/ui/BlogLoadingShells";

interface BlogTagPageProps {
  params: Promise<{ region: string; tagSlug: string }>;
}

type TagResult = Awaited<ReturnType<typeof getBlogTagArchive>>;
type PostsResult = Awaited<ReturnType<typeof getAllBlogPosts>>;

async function BlogTagPostsStream({
  region,
  tagSlug,
  postsPromise,
}: {
  region: string;
  tagSlug: string;
  postsPromise: Promise<PostsResult>;
}) {
  const { posts, pageInfo } = await postsPromise;

  return posts.length === 0 ? (
    <p className="text-brand-m_khonsa py-8 text-center">هنوز مقاله‌ای با این برچسب منتشر نشده است.</p>
  ) : (
    <LoadMorePosts region={region} initialPosts={posts} initialPageInfo={pageInfo} tagSlug={tagSlug} />
  );
}

export default async function BlogTagPage({ params }: BlogTagPageProps) {
  const { region, tagSlug } = await params;
  const tagPromise = getBlogTagArchive(tagSlug);
  const postsPromise = getAllBlogPosts({ tagSlugs: [tagSlug] });
  const tag = await tagPromise;

  if (!tag) {
    notFound();
    return null;
  }

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 text-white max-w-site">
      <div className="mb-8">
        <span className="text-xs font-bold text-brand-m_khonsa">برچسب</span>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">#{tag.name}</h1>
      </div>

      <Suspense fallback={<BlogTagPostsLoadingShell />}>
        <BlogTagPostsStream region={region} tagSlug={tagSlug} postsPromise={postsPromise} />
      </Suspense>
    </main>
  );
}
