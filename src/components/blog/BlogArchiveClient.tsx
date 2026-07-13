"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import BlogPostCard from "./BlogPostCard";

interface PageInfo { hasNextPage: boolean; endCursor: string | null; }

export default function BlogArchiveClient({
  initialPosts,
  initialPageInfo,
  region,
}: {
  initialPosts: any[];
  initialPageInfo: PageInfo;
  region: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [query, setQuery] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await fetch(`/api/blog/posts${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`, {
          cache: "no-store",
        });
        const data = await res.json();
        setPosts(data.posts ?? []);
        setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleLoadMore = async () => {
    if (!pageInfo.endCursor) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("after", pageInfo.endCursor);
      const res = await fetch(`/api/blog/posts?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
      setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-md">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-surface_m" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در مقالات..."
          className="w-full bg-brand-surface border border-white/5 rounded-xl pr-10 pl-4 py-3 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
        />
        {isPending && (
          <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue animate-spin" />
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-brand-m_khonsa py-8 text-center">
          {query ? "مقاله‌ای با این عبارت یافت نشد." : "هنوز هیچ مقاله‌ای منتشر نشده است."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} region={region} />
          ))}
        </div>
      )}

      {pageInfo.hasNextPage && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="self-center bg-brand-surface hover:bg-brand-surface_hover border border-white/5 text-brand-m_khonsa hover:text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {isLoadingMore && <Loader2 size={14} className="animate-spin" />}
          مقالات بیشتر
        </button>
      )}
    </div>
  );
}