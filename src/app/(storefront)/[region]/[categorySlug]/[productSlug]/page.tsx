import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getPostDetail,
  getRelatedPosts,
  getProducts,
  fetchGraphQL,
} from "@/lib/graphql";
import { POST_COMMENTS_QUERY } from "@/lib/graphql/blog";
import { resolveAvatarUrl } from "@/lib/avatars";
import { getCurrentUser } from "@/lib/auth/session";
import SocialShare from "@/components/blog/SocialShare";
import BlogSidebarInfo from "@/components/blog/BlogSidebarInfo";
import RelatedNewsPanel from "@/components/blog/RelatedNewsPanel";
import CommentThread from "@/components/comments/CommentThread";

interface PostPageProps {
  params: Promise<{ region: string; categorySlug: string; postSlug: string }>;
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { region, postSlug } = await params;
  const post = await getPostDetail(postSlug);
  if (!post) notFound();

  const category = post.categories?.nodes?.[0];
  const mainCategory = category?.parent?.node ?? category;
  const canonicalSlug = mainCategory?.slug ?? "uncategorized";

  const [user, relatedPosts, relatedProducts, commentsData] = await Promise.all([
    getCurrentUser().catch(() => null),
    category
      ? getRelatedPosts({
          categoryId: category.databaseId,
          categorySlug: category.slug,
          parentCategoryId: category.parent?.node?.databaseId ?? null,
          parentCategorySlug: category.parent?.node?.slug ?? null,
          excludeId: post.databaseId,
        })
      : Promise.resolve([]),
    mainCategory ? getProducts(mainCategory.slug, region).then((p) => p.slice(0, 5)) : Promise.resolve([]),
    fetchGraphQL(POST_COMMENTS_QUERY, { id: String(post.databaseId) }, [], "no-store"),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonicalUrl = `${siteUrl}/${region}/blog/${canonicalSlug}/${post.slug}`;

  const rawComments = commentsData?.post?.comments?.nodes ?? [];
  const initialComments = await Promise.all(
    rawComments.map(async (c: any) => ({
      ...c,
      author: { node: { ...c.author?.node, avatarUrl: await resolveAvatarUrl(c.author?.node?.avatarUrl) } },
    }))
  );

  return (
    <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 text-white max-w-site">
      {post.featuredImage?.node?.sourceUrl && (
        <div className="w-full h-[220px] sm:h-[300px] md:h-[420px] relative rounded-xl overflow-hidden bg-white/5 mb-6 md:mb-8">
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.title}
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="mb-6 md:mb-8 flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-brand-blue leading-tight">{post.title}</h1>
        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-brand-m_khonsa">
          {post.author?.node?.name && <span>نویسنده: <span className="text-white">{post.author.node.name}</span></span>}
          {post.date && <span>تاریخ: <span className="text-white">{new Date(post.date).toLocaleDateString("fa-IR")}</span></span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <aside className="order-2 lg:order-1 lg:col-span-3 lg:sticky lg:top-24">
          <BlogSidebarInfo
            postId={post.databaseId}
            averageRating={post.averageRating ?? 0}
            ratingCount={post.ratingCount ?? 0}
            toc={post.toc ?? []}
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
          <RelatedNewsPanel region={region} relatedPosts={relatedPosts} relatedProducts={relatedProducts} />
        </aside>
      </div>

      <div className="mt-10 md:mt-14 border-t border-brand-surface_hover pt-8 md:pt-10">
        <CommentThread
          targetId={post.databaseId}
          initialComments={initialComments}
          initialCommentsCount={post.commentsCount ?? 0}
          isLoggedIn={Boolean(user)}
          writeEndpoint="/api/blog/comments"
          replyEndpoint="/api/blog/comments/reply"
        />
      </div>
    </main>
  );
}