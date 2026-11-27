import { useState, useEffect } from "react";
import type { ProductNode } from "@/lib/graphql/types";
import { useActiveRegion } from "@/lib/hooks/useActiveRegion";

const MIN_QUERY_LENGTH = 2;
const QUICK_RESULTS_LIMIT = 6;
const DEBOUNCE_MS = 300;

interface UseProductSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ProductNode[];
  isPending: boolean;
}

export function useProductSearch(): UseProductSearchResult {
  const [searchQuery, setSearchQuery] = useState("");
  const { region: activeRegion } = useActiveRegion();
  const [searchResults, setSearchResults] = useState<ProductNode[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSearchResults([]);
      setIsPending(false);
      return;
    }

    const controller = new AbortController();
    setIsPending(true);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmed,
          region: activeRegion,
          first: String(QUICK_RESULTS_LIMIT),
        });
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) {
          setSearchResults(Array.isArray(data?.products) ? data.products : []);
        }
      } catch {
        if (!controller.signal.aborted) setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setIsPending(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [activeRegion, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isPending,
  };
}