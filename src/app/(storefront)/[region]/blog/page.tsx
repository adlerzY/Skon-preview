import { Suspense } from "react";
import { getAllBlogPosts } from "@/lib/graphql";
import BlogArchiveClient from "@/components/blog/BlogArchiveClient";
import { BlogArchivePostsLoadingShell } from "@/components/ui/BlogLoadingShells";

interface BlogPageProps {
  params: Promise<{ region: string }>;
}

async function BlogArchivePosts({ region }: { region: string }) {
  const { posts, pageInfo } = await getAllBlogPosts();
  return <BlogArchiveClient initialPosts={posts} initialPageInfo={pageInfo} region={region} />;
}

export default async function BlogArchivePage({ params }: BlogPageProps) {
  const { region } = await params;

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-site">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-blue mb-2">وبلاگ آرینا تو بتل</h1>
        <p className="text-brand-m_khonsa text-sm">جدیدترین اخبار و مقالات آموزشی</p>
      </div>

      <Suspense fallback={<BlogArchivePostsLoadingShell />}>
        <BlogArchivePosts region={region} />
      </Suspense>
    </main>
  );
}
