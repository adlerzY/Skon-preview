import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllBlogPosts } from "@/lib/graphql";
import BlogArchiveClient from "@/components/blog/BlogArchiveClient";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/jsonld";
import { makeMetadata, SEO_REGION } from "@/lib/seo/site";
import { BlogArchivePostsLoadingShell } from "@/components/ui/BlogLoadingShells";

interface BlogPageProps {
  params: Promise<{ region: string }>;
}

async function BlogArchivePosts({ region }: { region: string }) {
  const { posts, pageInfo } = await getAllBlogPosts();
  return <BlogArchiveClient initialPosts={posts} initialPageInfo={pageInfo} region={region} />;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { region } = await params;
  return makeMetadata({
    title: "اخبار و مقالات گیمینگ",
    description: "آخرین اخبار، آموزش‌ها و راهنماهای گیمینگ در وبلاگ Arena2Battle.",
    path: region === SEO_REGION ? `/${SEO_REGION}/blog` : undefined,
    noIndex: region !== SEO_REGION,
  });
}

export default async function BlogArchivePage({ params }: BlogPageProps) {
  const { region } = await params;
  const isSeoRegion = region === SEO_REGION;

  return (
    <main className="container mx-auto px-6 py-12 text-white max-w-site">
      {isSeoRegion && (
        <JsonLd data={breadcrumbSchema([
          { name: "فروشگاه", url: `/${SEO_REGION}` },
          { name: "وبلاگ", url: `/${SEO_REGION}/blog` },
        ])} />
      )}
      <Breadcrumbs items={[{ label: "فروشگاه", href: `/${region}` }, { label: "وبلاگ" }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-blue mb-2">وبلاگ آرنا2بتل</h1>
        <p className="text-brand-m_khonsa text-sm">جدیدترین اخبار و مقالات آموزشی</p>
      </div>

      <Suspense fallback={<BlogArchivePostsLoadingShell />}>
        <BlogArchivePosts region={region} />
      </Suspense>
    </main>
  );
}
