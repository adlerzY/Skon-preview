import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostDetail } from "@/lib/graphql";
import SocialShare from "@/components/blog/SocialShare";
import BlogSidebarInfo from "@/components/blog/BlogSidebarInfo";
import BlogRatingSlot from "@/components/blog/BlogRatingSlot";
import BlogRatingSkeleton from "@/components/blog/BlogRatingSkeleton";
import RelatedNewsPanelAsync from "@/components/blog/RelatedNewsPanelAsync";
import RelatedNewsPanelSkeleton from "@/components/blog/RelatedNewsPanelSkeleton";
import PostCommentsSection from "@/components/blog/PostCommentsSection";
import JsonLd from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { makeMetadata, SEO_REGION, stripHtml } from "@/lib/seo/site";

interface PostPageProps {
  params: Promise<{ region: string; categorySlug: string; postSlug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { region, postSlug } = await params;
  const post = await getPostDetail(postSlug);

  if (!post) {
    return {
      title: "مقاله پیدا نشد",
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  const category = post.categories?.nodes?.[0];
  const mainCategory = category?.parent?.node ?? category;
  const canonicalSlug = mainCategory?.slug ?? "uncategorized";

  return makeMetadata({
    title: post.title,
    description: post.excerpt,
    path: region === SEO_REGION ? `/${SEO_REGION}/blog/${canonicalSlug}/${post.slug}` : undefined,
    image: post.featuredImage?.node?.sourceUrl,
    noIndex: region !== SEO_REGION,
  });
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { region, postSlug } = await params;
  const post = await getPostDetail(postSlug);
  if (!post) notFound();

  const category = post.categories?.nodes?.[0];
  const mainCategory = category?.parent?.node ?? category;
  const canonicalSlug = mainCategory?.slug ?? "uncategorized";
  const canonicalPath = `/${SEO_REGION}/blog/${canonicalSlug}/${post.slug}`;
  const isSeoRegion = region === SEO_REGION;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonicalUrl = `${siteUrl}/${region}/blog/${canonicalSlug}/${post.slug}`;

  const postTags = post.tags?.nodes ?? [];
  const featuredImageUrl: string | undefined = post.featuredImage?.node?.sourceUrl;

  return (
    <main className="w-full text-white">
      {isSeoRegion && (
        <JsonLd
          data={[
            articleSchema({
              title: post.title,
              description: stripHtml(post.excerpt).slice(0, 300),
              url: canonicalPath,
              image: featuredImageUrl,
              datePublished: post.date,
              authorName: post.author?.node?.name,
            }),
            breadcrumbSchema([
              { name: "فروشگاه", url: `/${SEO_REGION}` },
              { name: "وبلاگ", url: `/${SEO_REGION}/blog` },
              { name: mainCategory?.name ?? "اخبار", url: `/${SEO_REGION}/blog/${canonicalSlug}` },
              { name: post.title, url: canonicalPath },
            ]),
          ]}
        />
      )}

      <div
        className={`container mx-auto max-w-site px-4 pb-8 md:px-6 md:pb-12 ${
          featuredImageUrl ? "pt-3" : "pt-8 md:pt-12"
        }`}
      >
        {featuredImageUrl && (
          <div className="relative mb-6 aspect-[16/9] max-h-[360px] w-full overflow-hidden bg-white/5 sm:max-h-[440px] md:mb-8 lg:max-h-[520px]">
            <img
              src={featuredImageUrl}
              alt={post.title}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mb-6 md:mb-8 flex flex-col gap-3">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-brand-blue leading-tight">{post.title}</h1>
          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-brand-m_khonsa">
            {post.author?.node?.name && <span>نویسنده: <span className="text-white">{post.author.node.name}</span></span>}
            {post.date && <span>تاریخ: <span className="text-white">{new Date(post.date).toLocaleDateString("fa-IR")}</span></span>}
          </div>
          {postTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {postTags.map((tag: any) => (
                <Link
                  key={tag.slug}
                  href={`/${region}/blog/tag/${tag.slug}`}
                  className="text-[11px] font-bold text-brand-m_khonsa bg-white/5 hover:bg-brand-blue hover:text-white border border-white/10 px-2.5 py-1 rounded-full transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <aside className="order-2 lg:order-1 lg:col-span-3 lg:sticky lg:top-24">
            <BlogSidebarInfo
              toc={post.toc ?? []}
              ratingSlot={
                <Suspense fallback={<BlogRatingSkeleton />}>
                  <BlogRatingSlot
                    postId={post.databaseId}
                    averageRating={post.averageRating ?? 0}
                    ratingCount={post.ratingCount ?? 0}
                  />
                </Suspense>
              }
            />
          </aside>

          <article className="order-1 lg:order-2 lg:col-span-6 flex flex-col gap-6 min-w-0">
            <SocialShare url={canonicalUrl} title={post.title} />
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          <aside className="order-3 lg:col-span-3 min-w-0">
            <Suspense fallback={<RelatedNewsPanelSkeleton />}>
              <RelatedNewsPanelAsync region={region} category={category} excludeId={post.databaseId} />
            </Suspense>
          </aside>
        </div>

        <div className="mt-10 md:mt-14 border-t border-brand-surface_hover pt-8 md:pt-10">
          <PostCommentsSection
            postId={post.databaseId}
            initialCommentsCount={post.commentsCount ?? 0}
          />
        </div>
      </div>
    </main>
  );
}