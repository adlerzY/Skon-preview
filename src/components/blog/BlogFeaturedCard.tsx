import Image from "next/image";
import Link from "next/link";
import { memo } from "react";

interface BlogFeaturedCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    date?: string;
    featuredImage?: { node?: { sourceUrl?: string } };
    categories?: { nodes?: { slug?: string; name?: string }[] };
  };
  region: string;
}

function BlogFeaturedCard({ post, region }: BlogFeaturedCardProps) {
  const category = post.categories?.nodes?.[0];
  const categorySlug = category?.slug || "uncategorized";
  const imageUrl = post.featuredImage?.node?.sourceUrl;

  return (
    <Link
      href={`/${region}/blog/${categorySlug}/${post.slug}`}
      className="group flex flex-col bg-brand-surface border border-white/5 hover:border-brand-blue/40 rounded-xl overflow-hidden transition-colors h-full"
    >
      <div className="relative w-full aspect-[16/10] bg-white/5 overflow-hidden shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">بدون تصویر</div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {category?.name && (
          <span className="self-start text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full">
            {category.name}
          </span>
        )}
        <h3 className="font-bold text-sm text-white group-hover:text-brand-blue transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.date && (
          <span className="text-[11px] text-brand-surface_m mt-auto pt-1">
            {new Date(post.date).toLocaleDateString("fa-IR")}
          </span>
        )}
      </div>
    </Link>
  );
}

export default memo(BlogFeaturedCard);