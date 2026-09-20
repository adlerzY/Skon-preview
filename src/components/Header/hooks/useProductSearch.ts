import { useState, useEffect, useTransition } from "react";
import { searchProductsByKeyword } from "@/actions/search";
import type { ProductNode } from "@/lib/graphql";
import { useActiveRegion } from "@/lib/hooks/useActiveRegion";

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
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchProductsByKeyword(searchQuery, activeRegion);
        if (!cancelled) {
          setSearchResults(results.products);
        }
      });
    }, 400);

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