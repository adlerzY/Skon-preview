import { notFound } from "next/navigation";
import { getBlogCategoryArchive } from "@/lib/graphql";
import BlogPostCard from "@/components/blog/BlogPostCard";

interface BlogCategoryPageProps {
  params: Promise<{ region: string; categorySlug: string }>;
}

export default async function BlogCategoryPage({ params }: BlogCategoryPageProps) {
  const { region, categorySlug } = await params;
  const categoryData = await getBlogCategoryArchive(categorySlug);

  if (!categoryData) notFound();

  const posts = categoryData.posts?.nodes || [];

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-site">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-blue mb-2">
          مقالات دسته‌بندی: {categoryData.name}
        </h1>
        <p className="text-brand-m_khonsa text-sm">منطقه: {region}</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-brand-m_khonsa py-8 text-center">هنوز مقاله‌ای در این دسته‌بندی منتشر نشده است.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <BlogPostCard key={post.id} post={post} region={region} categorySlug={categorySlug} />
          ))}
        </div>
      )}
    </main>
  );
}