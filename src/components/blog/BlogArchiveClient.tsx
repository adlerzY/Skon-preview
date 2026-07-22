"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import BlogPostCard from "./BlogPostCard";
import BlogFeaturedCard from "./BlogFeaturedCard";
import { useBlogPosts } from "./hooks/seBlogPosts";

interface PageInfo { hasNextPage: boolean; endCursor: string | null; }

const FEATURED_COUNT = 4;

export default function BlogArchiveClient({
  initialPosts,
  initialPageInfo,
  region,
}: {
  initialPosts: any[];
  initialPageInfo: PageInfo;
  region: string;
}) {
  const [query, setQuery] = useState("");
  const [featuredPosts] = useState(() => initialPosts.slice(0, FEATURED_COUNT));
  const featuredIds = new Set(featuredPosts.map((p) => p.id));

  const buildParams = useCallback(
    (after?: string) => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (after) params.set("after", after);
      return params;
    },
    [query]
  );

  const { posts, pageInfo, isLoading, refetch, loadMore } = useBlogPosts({
    initialPosts,
    initialPageInfo,
    buildParams,
    debounceMs: 400,
  });

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const isSearching = query.trim().length > 0;
  const listPosts = isSearching ? posts : posts.filter((p) => !featuredIds.has(p.id));

  return (
    <div className="flex flex-col gap-8">
      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در مقالات..."
          className="w-full bg-brand-surface border border-white/5 rounded-xl pr-10 pl-4 py-3 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
        />
        {isLoading && <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue animate-spin" />}
      </div>

      {!isSearching && featuredPosts.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black text-white">آخرین اخبار</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredPosts.map((post) => (
              <BlogFeaturedCard key={post.id} post={post} region={region} />
            ))}
          </div>
        </div>
      )}

      {listPosts.length === 0 ? (
        <p className="text-brand-m_khonsa py-8 text-center">
          {isSearching ? "مقاله‌ای با این عبارت یافت نشد." : "هنوز مقاله دیگری منتشر نشده است."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {listPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} region={region} />
          ))}
        </div>
      )}

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