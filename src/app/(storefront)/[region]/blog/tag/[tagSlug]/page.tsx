import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getBlogTagArchive, getAllBlogPosts } from "@/lib/graphql";
import LoadMorePosts from "@/components/blog/LoadMorePosts";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { makeMetadata, SEO_REGION } from "@/lib/seo/site";
import { BlogTagPostsLoadingShell } from "@/components/ui/BlogLoadingShells";

interface BlogTagPageProps {
  params: Promise<{ region: string; tagSlug: string }>;
}

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

export async function generateMetadata({ params }: BlogTagPageProps): Promise<Metadata> {
  const { region, tagSlug } = await params;
  const tag = await getBlogTagArchive(tagSlug);

  if (!tag) {
    return {
      title: "برچسب پیدا نشد",
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  return makeMetadata({
    title: `مقالات با برچسب ${tag.name}`,
    description: `مقالات Arena2Battle با برچسب ${tag.name}.`,
    noIndex: true,
  });
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
      <Breadcrumbs items={[{ label: "فروشگاه", href: `/${region}` }, { label: "وبلاگ", href: `/${region}/blog` }, { label: `#${tag.name}` }]} />
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
