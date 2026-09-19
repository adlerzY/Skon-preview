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
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const fetchPosts = useCallback(
    async (after?: string, append = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestSeq = ++requestSeqRef.current;
      setIsLoading(true);

      try {
        const params = buildParams(after);
        const res = await fetch(`/api/blog/posts?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted || requestSeq !== requestSeqRef.current) return;
        if (!res.ok) throw new Error(data?.error || "خطا در دریافت مطالب بلاگ");

        setPosts((prev) => (append ? [...prev, ...(data.posts ?? [])] : data.posts ?? []));
        setPageInfo(data.pageInfo ?? { hasNextPage: false, endCursor: null });
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        console.error("Blog posts fetch error:", error);
      } finally {
        if (requestSeq === requestSeqRef.current) setIsLoading(false);
      }
    },
    [buildParams],
  );

  const refetch = useCallback(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (debounceMs > 0) {
      debounceRef.current = setTimeout(() => void fetchPosts(), debounceMs);
    } else {
      void fetchPosts();
    }
  }, [fetchPosts, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      requestSeqRef.current += 1;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!pageInfo.endCursor || isLoading) return;
    void fetchPosts(pageInfo.endCursor, true);
  }, [pageInfo.endCursor, fetchPosts, isLoading]);

  return { posts, pageInfo, isLoading, refetch, loadMore };
}
