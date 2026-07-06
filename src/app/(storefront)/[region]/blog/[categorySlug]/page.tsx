import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getBlogCategoryArchive } from "@/lib/graphql";
import Link from "next/link";

interface BlogCategoryPageProps {
  params: Promise<{
    region: string;
    categorySlug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function BlogCategoryPage({ params }: BlogCategoryPageProps) {
  const { region, categorySlug } = await params;

  const knownRegions = ["eu", "us", "tr"];
  const cookieStore = await cookies();
  const activeRegion = cookieStore.get("store_region")?.value || "eu";

  if (!knownRegions.includes(region.toLowerCase())) {
    redirect(`/${activeRegion}/blog/${categorySlug}`);
  }

  // فچ کردن دیتای واقعی بلاگ
  const categoryData = await getBlogCategoryArchive(categorySlug);

  if (!categoryData) {
    notFound();
  }

  const posts = categoryData.posts?.nodes || [];

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-[1600px]">
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
            <Link 
              key={post.id} 
              href={`/${region}/blog/${categorySlug}/${post.slug}`}
              className="bg-brand-surface border border-white/5 rounded-2xl overflow-hidden hover:border-brand-blue/50 transition-all flex flex-col group"
            >
              {post.featuredImage?.node?.sourceUrl && (
                <div className="aspect-video w-full overflow-hidden bg-white/5">
                  <img 
                    src={post.featuredImage.node.sourceUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                <h2 className="font-bold text-lg text-white group-hover:text-brand-blue transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <div className="flex justify-between items-center text-xs text-brand-m_khonsa border-t border-white/5 pt-3">
                  <span>{post.author?.node?.name || "نویسنده"}</span>
                  <span>{post.date ? new Date(post.date).toLocaleDateString("fa-IR") : ""}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}