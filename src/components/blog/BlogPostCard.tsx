import Image from "next/image";
import Link from "next/link";

interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    date?: string;
    featuredImage?: { node?: { sourceUrl?: string } };
    author?: { node?: { name?: string } };
    categories?: { nodes?: { slug?: string }[] };
  };
  region: string;
  categorySlug?: string;
}

export default function BlogPostCard({ post, region, categorySlug }: BlogPostCardProps) {
  const resolvedCategorySlug = categorySlug || post.categories?.nodes?.[0]?.slug || "uncategorized";
  const imageUrl = post.featuredImage?.node?.sourceUrl;

  return (
    <Link
      href={`/${region}/blog/${resolvedCategorySlug}/${post.slug}`}
      className="bg-brand-surface border border-white/5 rounded-2xl overflow-hidden hover:border-brand-blue/50 transition-all flex flex-col group"
    >
      {imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-white/5">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
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
  );
}