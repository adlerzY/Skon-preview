"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface UseBlogPostsParams {
  initialPosts: any[];
  initialPageInfo: PageInfo;
  buildParams: (after?: string) => URLSearchParams;
  debounceMs?: number;
}

export function useBlogPosts({ initialPosts, initialPageInfo, buildParams, debounceMs = 0 }: UseBlogPostsParams) {
  const [posts, setPosts] = useState(initialPosts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const isFirstRun = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPosts = useCallback(
    async (after?: string, append = false) => {
      setIsLoading(true);
      try {
        const params = buildParams(after);
        const res = await fetch(`/api/blog/posts?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        setPosts((prev) => (append ? [...prev, ...(data.posts ?? [])] : data.posts ?? []));
        setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const refetch = useCallback(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (debounceMs > 0) {
      debounceRef.current = setTimeout(() => fetchPosts(), debounceMs);
    } else {
      fetchPosts();
    }
  }, [fetchPosts, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!pageInfo.endCursor) return;
    fetchPosts(pageInfo.endCursor, true);
  }, [pageInfo.endCursor, fetchPosts]);

  return { posts, pageInfo, isLoading, refetch, loadMore };
}