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
  const requestSeqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(
    async (after?: string, append = false) => {
      const requestSeq = ++requestSeqRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      try {
        const params = buildParams(after);
        const res = await fetch(`/api/blog/posts?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error("blog_posts_request_failed");
        const data = await res.json();
        if (requestSeq !== requestSeqRef.current || controller.signal.aborted) return;
        setPosts((prev) => (append ? [...prev, ...(data.posts ?? [])] : data.posts ?? []));
        setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          console.error("Blog posts request failed:", error);
        }
      } finally {
        if (requestSeq === requestSeqRef.current) setIsLoading(false);
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
      abortRef.current?.abort();
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!pageInfo.endCursor) return;
    fetchPosts(pageInfo.endCursor, true);
  }, [pageInfo.endCursor, fetchPosts]);

  return { posts, pageInfo, isLoading, refetch, loadMore };
}