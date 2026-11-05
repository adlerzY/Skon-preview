import { useState, useEffect, useTransition } from "react";
import { searchProductsByKeyword } from "@/actions/search";
import type { ProductNode } from "@/lib/graphql/types";
import { useActiveRegion } from "@/lib/hooks/useActiveRegion";

const MIN_QUERY_LENGTH = 2;
const QUICK_RESULTS_LIMIT = 6;
const DEBOUNCE_MS = 350;

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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchProductsByKeyword(trimmed, activeRegion, { first: QUICK_RESULTS_LIMIT });
        if (!cancelled) {
          setSearchResults(results.products);
        }
      });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
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