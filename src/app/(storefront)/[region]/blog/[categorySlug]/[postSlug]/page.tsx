import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPostDetail } from "@/lib/graphql";
import SocialShare from "@/components/blog/SocialShare";
import BlogSidebarInfo from "@/components/blog/BlogSidebarInfo";
import BlogRatingSlot from "@/components/blog/BlogRatingSlot";
import BlogRatingSkeleton from "@/components/blog/BlogRatingSkeleton";
import { BlogPostLoadingShell } from "@/components/ui/BlogLoadingShells";
import RelatedNewsPanelAsync from "@/components/blog/RelatedNewsPanelAsync";
import RelatedNewsPanelSkeleton from "@/components/blog/RelatedNewsPanelSkeleton";
import PostCommentsSection from "@/components/blog/PostCommentsSection";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { makeMetadata, SEO_REGION, stripHtml, absoluteUrl } from "@/lib/seo/site";

interface PostPageProps {
  params: Promise<{ region: string; categorySlug: string; postSlug: string }>;
}

interface BlogPostStreamProps {
  region: string;
  requestedCategorySlug: string;
  postPromise: ReturnType<typeof getPostDetail>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { region, categorySlug, postSlug } = await params;
  const post = await getPostDetail(postSlug);

  if (!post) {
    return {
      title: "مقاله پیدا نشد",
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  const category = post.categories?.nodes?.[0];
  const mainCategory = category?.parent?.node ?? category;
  const canonicalCategorySlug = mainCategory?.slug || category?.slug || categorySlug;
  const canonicalPath = `/${SEO_REGION}/blog/${canonicalCategorySlug}/${post.slug}`;

  return makeMetadata({
    title: post.title,
    description: stripHtml(post.excerpt || post.content || post.title),
    path: region === SEO_REGION ? canonicalPath : undefined,
    image: post.featuredImage?.node?.sourceUrl,
    noIndex: region !== SEO_REGION,
  });
}

async function BlogPostStream({ region, requestedCategorySlug, postPromise }: BlogPostStreamProps) {
  const post = await postPromise;
  if (!post) {
    notFound();
    return null;
  }

  const category = post.categories?.nodes?.[0];
  const mainCategory = category?.parent?.node ?? category;
  const canonicalSlug = mainCategory?.slug ?? category?.slug ?? requestedCategorySlug;

  if (canonicalSlug && canonicalSlug !== requestedCategorySlug) {
    permanentRedirect(`/${region}/blog/${canonicalSlug}/${post.slug}`);
  }

  const canonicalUrl = `/${region}/blog/${canonicalSlug}/${post.slug}`;
  const isSeoRegion = region === SEO_REGION;
  const categoryName = mainCategory?.name ?? category?.name ?? canonicalSlug;
  const postTags = post.tags?.nodes ?? [];

  return (
    <div className="w-full text-white">
      {isSeoRegion && (
        <JsonLd
          data={[
            articleSchema({
              title: post.title,
              description: stripHtml(post.excerpt || post.content || post.title),
              url: canonicalUrl,
              image: post.featuredImage?.node?.sourceUrl,
              datePublished: post.date,
              dateModified: post.modified,
              authorName: post.author?.node?.name,
            }),
            breadcrumbSchema([
              { name: "فروشگاه", url: `/${SEO_REGION}` },
              { name: "وبلاگ", url: `/${SEO_REGION}/blog` },
              { name: categoryName, url: `/${SEO_REGION}/blog/${canonicalSlug}` },
              { name: post.title, url: canonicalUrl },
            ]),
          ]}
        />
      )}
      <Breadcrumbs
        items={[
          { label: "فروشگاه", href: `/${region}` },
          { label: "وبلاگ", href: `/${region}/blog` },
          { label: categoryName, href: `/${region}/blog/${canonicalSlug}` },
          { label: post.title },
        ]}
      />
      {post.featuredImage?.node?.sourceUrl && (
        <div className="w-full h-[220px] sm:h-[300px] md:h-[420px] relative rounded-xl overflow-hidden bg-white/5 mb-6 md:mb-8">
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.title}
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            quality={88}
            className="object-cover"
            preload
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
          <SocialShare url={absoluteUrl(canonicalUrl)} title={post.title} />
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
  );
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { region, categorySlug, postSlug } = await params;
  const postPromise = getPostDetail(postSlug);

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 text-white max-w-site">
      <Suspense fallback={<BlogPostLoadingShell />}>
        <BlogPostStream region={region} requestedCategorySlug={categorySlug} postPromise={postPromise} />
      </Suspense>
    </main>
  );
}
