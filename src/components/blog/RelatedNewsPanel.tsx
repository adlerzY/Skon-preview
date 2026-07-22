import Image from "next/image";
import Link from "next/link";
import { Newspaper, Package } from "lucide-react";
import { ProductNode } from "@/lib/graphql";

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  date?: string;
  featuredImage?: { node?: { sourceUrl?: string } };
  categories?: { nodes?: { slug?: string }[] };
}

export default function RelatedNewsPanel({
  region,
  relatedPosts,
  relatedProducts,
}: {
  region: string;
  relatedPosts: RelatedPost[];
  relatedProducts: ProductNode[];
}) {
  if (relatedPosts.length === 0 && relatedProducts.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {relatedProducts.length > 0 && (
        <div className="bg-brand-surface border border-brand-surface_hover p-4">
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-m_khonsa mb-3">
            <Package size={13} />
            محصولات مرتبط
          </span>
          <div className="flex flex-col gap-1">
            {relatedProducts.map((p) => {
              const category = p.productCategories?.nodes?.[0];
              return (
                <Link
                  key={p.id}
                  href={`/${region}/${category?.slug || "uncategorized"}/${p.slug}`}
                  className="flex items-center gap-2.5 py-1.5 group"
                >
                  <div className="relative w-8 h-8 shrink-0 bg-brand-bg overflow-hidden rounded">
                    {p.image?.sourceUrl && <Image src={p.image.sourceUrl} alt={p.name} fill sizes="32px" className="object-cover" />}
                  </div>
                  <span className="text-xs text-brand-m_khonsa group-hover:text-brand-blue transition-colors truncate">{p.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {relatedPosts.length > 0 && (
        <div className="bg-brand-surface border border-brand-surface_hover p-4">
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-m_khonsa mb-3">
            <Newspaper size={13} />
            اخبار مشابه
          </span>
          <div className="flex flex-col gap-1">
            {relatedPosts.map((post) => {
              const catSlug = post.categories?.nodes?.[0]?.slug || "uncategorized";
              return (
                <Link
                  key={post.id}
                  href={`/${region}/blog/${catSlug}/${post.slug}`}
                  className="flex items-center gap-2.5 py-1.5 group"
                >
                  <div className="relative w-8 h-8 shrink-0 bg-brand-bg overflow-hidden rounded">
                    {post.featuredImage?.node?.sourceUrl && (
                      <Image src={post.featuredImage.node.sourceUrl} alt={post.title} fill sizes="32px" className="object-cover" />
                    )}
                  </div>
                  <span className="text-xs text-brand-m_khonsa group-hover:text-brand-blue transition-colors line-clamp-2">{post.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}