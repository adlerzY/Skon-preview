import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { MessageCircle } from "lucide-react";

interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    date?: string;
    excerpt?: string;
    commentsCount?: number;
    featuredImage?: { node?: { sourceUrl?: string } };
    author?: { node?: { name?: string } };
    categories?: { nodes?: { slug?: string; name?: string }[] };
  };
  region: string;
  categorySlug?: string;
}

function stripHtml(html?: string) {
  return html ? html.replace(/<[^>]*>/g, "").trim() : "";
}

function BlogPostCard({ post, region, categorySlug }: BlogPostCardProps) {
  const category = post.categories?.nodes?.[0];
  const resolvedCategorySlug = categorySlug || category?.slug || "uncategorized";
  const imageUrl = post.featuredImage?.node?.sourceUrl;
  const excerpt = stripHtml(post.excerpt);

  return (
    <Link
      href={`/${region}/blog/${resolvedCategorySlug}/${post.slug}`}
      className="group flex bg-brand-surface border border-white/5 hover:border-brand-blue/40 rounded-xl overflow-hidden transition-colors w-full"
    >
      <div className="relative w-[110px] sm:w-[180px] md:w-[220px] shrink-0 aspect-[4/3] bg-white/5 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 110px, (max-width: 768px) 180px, 220px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">بدون تصویر</div>
        )}
      </div>

      <div className="flex flex-col justify-center flex-1 min-w-0 p-3 sm:p-4 md:p-5 gap-1.5">
        {category?.name && (
          <span className="self-start text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full">
            {category.name}
          </span>
        )}
        <h2 className="font-bold text-sm sm:text-base md:text-lg text-white group-hover:text-brand-blue transition-colors line-clamp-2">
          {post.title}
        </h2>
        {excerpt && (
          <p className="hidden sm:block text-xs text-brand-m_khonsa leading-relaxed line-clamp-2">{excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-brand-surface_m mt-1">
          <span>{post.author?.node?.name || "نویسنده"}</span>
          {post.date && <span>{new Date(post.date).toLocaleDateString("fa-IR")}</span>}
          {typeof post.commentsCount === "number" && post.commentsCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle size={11} />
              {post.commentsCount.toLocaleString("fa-IR")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(BlogPostCard);