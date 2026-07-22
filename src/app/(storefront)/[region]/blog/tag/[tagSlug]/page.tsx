import { notFound } from "next/navigation";
import { getBlogTagArchive, getAllBlogPosts } from "@/lib/graphql";
import LoadMorePosts from "@/components/blog/LoadMorePosts";

interface BlogTagPageProps {
  params: Promise<{ region: string; tagSlug: string }>;
}

export default async function BlogTagPage({ params }: BlogTagPageProps) {
  const { region, tagSlug } = await params;
  const tag = await getBlogTagArchive(tagSlug);
  if (!tag) notFound();

  const { posts, pageInfo } = await getAllBlogPosts({ tagSlugs: [tagSlug] });

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 text-white max-w-site">
      <div className="mb-8">
        <span className="text-xs font-bold text-brand-m_khonsa">برچسب</span>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-blue">#{tag.name}</h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-brand-m_khonsa py-8 text-center">هنوز مقاله‌ای با این برچسب منتشر نشده است.</p>
      ) : (
        <LoadMorePosts region={region} initialPosts={posts} initialPageInfo={pageInfo} tagSlug={tagSlug} />
      )}
    </main>
  );
}