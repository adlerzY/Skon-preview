"use client";

import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import BlogPostCard from "./BlogPostCard";
import { useBlogPosts } from "./hooks/seBlogPosts";

interface PageInfo { hasNextPage: boolean; endCursor: string | null; }

export default function LoadMorePosts({
  region,
  initialPosts,
  initialPageInfo,
  tagSlug,
}: {
  region: string;
  initialPosts: any[];
  initialPageInfo: PageInfo;
  tagSlug: string;
}) {
  const buildParams = useCallback(
    (after?: string) => {
      const params = new URLSearchParams();
      params.set("tagSlugs", tagSlug);
      if (after) params.set("after", after);
      return params;
    },
    [tagSlug]
  );

  const { posts, pageInfo, isLoading, loadMore } = useBlogPosts({ initialPosts, initialPageInfo, buildParams });

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} region={region} />
      ))}
      {pageInfo.hasNextPage && (
        <button
          type="button"
          onClick={loadMore}
          disabled={isLoading}
          className="self-center bg-brand-surface hover:bg-brand-surface_hover border border-white/5 text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          مقالات بیشتر
        </button>
      )}
    </div>
  );
}