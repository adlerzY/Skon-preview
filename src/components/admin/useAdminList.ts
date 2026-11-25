"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AdminPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface AdminListData<T> {
  nodes: T[];
  pageInfo: AdminPageInfo;
}

const EMPTY_PAGE: AdminPageInfo = { hasNextPage: false, endCursor: null };

function buildUrl(endpoint: string, params: Record<string, string>, after?: string | null) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  if (after) query.set("after", after);
  return `${endpoint}?${query.toString()}`;
}

export function useAdminList<D extends AdminListData<unknown>>({
  endpoint,
  params,
  initial,
  debounceMs = 350,
}: {
  endpoint: string;
  params: Record<string, string>;
  initial?: D;
  debounceMs?: number;
}) {
  const paramsKey = JSON.stringify(params);
  const [data, setData] = useState<D>(initial ?? ({ nodes: [], pageInfo: EMPTY_PAGE } as unknown as D));
  const [loading, setLoading] = useState(!initial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const settledKeyRef = useRef<string | null>(initial ? paramsKey : null);
  const abortRef = useRef<AbortController | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const run = useCallback(
    async (mode: "replace" | "append", after?: string | null) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (mode === "append") {
        setLoadingMore(true);
      } else {
        setLoadingMore(false);
        setLoading(true);
      }
      setError("");

      try {
        const response = await fetch(buildUrl(endpoint, paramsRef.current, after), {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await response.json().catch(() => null);
        if (controller.signal.aborted) return;

        if (!response.ok || !json) {
          setError(json?.error || "خطا در دریافت اطلاعات");
          return;
        }

        const incoming = {
          ...json,
          nodes: Array.isArray(json.nodes) ? json.nodes : [],
          pageInfo: json.pageInfo ?? EMPTY_PAGE,
        } as D;

        setData((previous) =>
          mode === "append"
            ? ({ ...incoming, nodes: [...previous.nodes, ...incoming.nodes] } as D)
            : incoming
        );
      } catch (caught) {
        if ((caught as Error)?.name !== "AbortError") setError("خطا در ارتباط با سرور");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [endpoint]
  );

  useEffect(() => {
    if (settledKeyRef.current === paramsKey) return;
    const delay = settledKeyRef.current === null ? 0 : debounceMs;
    setLoading(true);
    const timer = window.setTimeout(() => {
      settledKeyRef.current = paramsKey;
      void run("replace");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [paramsKey, debounceMs, run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const refresh = useCallback(() => run("replace"), [run]);

  const loadMore = useCallback(() => {
    if (!data.pageInfo.hasNextPage || !data.pageInfo.endCursor || loading || loadingMore) return;
    void run("append", data.pageInfo.endCursor);
  }, [data.pageInfo.hasNextPage, data.pageInfo.endCursor, loading, loadingMore, run]);

  return { data, setData, loading, loadingMore, error, refresh, loadMore };
}